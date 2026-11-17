import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import "../css/styles.css";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
} from "react-icons/fa";
import axios from "axios";

declare global {
  interface Window {
    pendingAutoAnswer?: string;
  }
}

interface CallRequest {
  from: string;
  to: string;
}

interface WebRTCAnswer extends CallRequest {
  answer: RTCSessionDescriptionInit;
}

interface CallHistoryEntry {
  ngoId: string;
  donorId: string;
  donorName: string;
  status: "answered" | "missed" | "rejected";
  duration?: number; // in seconds
}

const VideoCallingApp: React.FC = () => {
  const location = useLocation();
  const { ngoId } = useParams<{ ngoId: string }>();
  const query = new URLSearchParams(location.search);
  const donorId = query.get("donorId") ?? "";
  const donorName = query.get("donorName") ?? "";
  const email = query.get("email") ?? "";

  const navigate = useNavigate();

  // State variables
  // const [username, setUsername] = useState<string>('');
  const [_userId, setUserId] = useState<string>("");
  const [_users, setUsers] = useState<Record<string, any>>({});
  const [, setRemoteUser] = useState<string | null>(null);
  const [_isCallInProgress, setIsCallInProgress] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<string>(""); // 'calling', 'ringing', 'connected'
  const [_notification, setNotification] = useState<{
    type: "incoming" | "outgoing" | "missed" | null;
    user: string | null;
  }>({ type: null, user: null });
  const [isAudioOn, setIsAudioOn] = useState<boolean>(true);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  // const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  // const [isNgoOnline, setIsNgoOnline] = useState<boolean>(false);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callConnectedRef = useRef(false);
  const callStartTimeRef = useRef<number | null>(null);
  const missedCallTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callEndedRef = useRef(false);

  const apiUrl = import.meta.env.VITE_HOST_URL;
  const logCallHistory = async (status: "answered" | "missed" | "rejected") => {
    const endTime = Date.now();
    const duration =
      status === "answered" && callStartTimeRef.current
        ? Math.floor((endTime - callStartTimeRef.current) / 1000)
        : undefined;

    const callEntry: CallHistoryEntry = {
      ngoId: ngoId || "",
      donorId,
      donorName,
      status,
      duration,
    };

    try {
      // console.log("Api calling", callEntry);
      await axios.post(`${apiUrl}/ngo/call-history`, callEntry, {
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': `Bearer ${localStorage.getItem('authToken')}` // If using auth
        },
      });
      // console.log(`✅ Call history logged: ${status}`);
    } catch (error) {
      console.error("❌ Failed to log call history:", error);
      // Optional: Add retry logic or fallback storage here
    }
  };

  const checkNgoOnlineFor30Seconds = async (
    ngoId: string
  ): Promise<boolean> => {
    const isNgoAlreadyOnline = await new Promise<boolean>((resolveCheck) => {
      socketRef.current?.emit(
        "check-ngo-and-notify",
        { ngoId, email, donorName }, // make sure `email` is in scope
        (response: { isOnline: boolean }) => resolveCheck(response.isOnline)
      );
    });

    if (isNgoAlreadyOnline) {
      // console.log("NGO is already online");
      return true;
    }

    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve(false);
        return;
      }

      // Register for real-time notification
      socketRef.current.emit("register-waiting-donor", {
        donorId,
        ngoId,
      });

      // Set up listener for when NGO comes online
      const onlineListener = ({ ngoId: onlineNgoId }: { ngoId: string }) => {
        if (onlineNgoId === ngoId) {
          socketRef.current?.off("ngo-now-online", onlineListener);
          resolve(true);
        }
      };

      socketRef.current.on("ngo-now-online", onlineListener);

      // Also do periodic checking as fallback
      const startTime = Date.now();
      const CHECK_INTERVAL = 2000;
      const MAX_WAIT_TIME = 45000;

      const interval = setInterval(async () => {
        const isOnline = await new Promise<boolean>((resolveCheck) => {
          socketRef.current?.emit(
            "check-ngo-online",
            { userId: donorId, targetUserId: ngoId, email },
            (response: { isOnline: boolean }) => resolveCheck(response.isOnline)
          );
        });

        if (isOnline) {
          clearInterval(interval);
          socketRef.current?.off("ngo-now-online", onlineListener);
          resolve(true);
        } else if (Date.now() - startTime >= MAX_WAIT_TIME) {
          clearInterval(interval);
          socketRef.current?.off("ngo-now-online", onlineListener);
          resolve(false);
        }
      }, CHECK_INTERVAL);

      // Set overall timeout
      setTimeout(() => {
        clearInterval(interval);
        socketRef.current?.off("ngo-now-online", onlineListener);
      }, MAX_WAIT_TIME);
    });
  };

  // Use this to start the call process
  useEffect(() => {
    // console.log("Effect triggered with ngoId:", ngoId, "donorId:", donorId);
    if (!ngoId || !donorId) return;

    let isMounted = true;

    const timer = setTimeout(() => {
      // console.log("Starting initiateCall after delay");
      // console.log("Socket connected?", socketRef.current?.connected);

      const initiateCall = async () => {
        setCallStatus("calling");
        console.log("initiateCall function executing");
        try {
          console.log("About to check NGO online status");
          const isOnline = await checkNgoOnlineFor30Seconds(ngoId);
          console.log("NGO online status check result:", isOnline);

          if (isMounted && isOnline) {
            console.log("NGO is online - starting call");
            startCall(ngoId);
          } else if (isMounted) {
            setCallStatus("");
            console.log("NGO did not come online within 30 seconds");

            logCallHistory("missed");
            setCallStatus("");
            setTimeout(() => {
              navigate(-1);
            }, 2500);
          }
        } catch (error) {
          console.error("Error checking NGO status:", error);
        }
      };

      initiateCall();
    }, 2000);

    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, [ngoId, donorId]);

  // Actually call the function
  // const hasStartedCall = useRef(false);
  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(
      "https://webrtcservice-evhdchcccwbvc9bb.canadacentral-01.azurewebsites.net",
      {
        transports: ["websocket"], // Ensures WebSocket is used
        secure: true, // Forces secure connection
        reconnection: true, // Auto-reconnect if disconnected
        reconnectionAttempts: 5, // Number of attempts
        reconnectionDelay: 3000, // Wait 3s before reconnecting
      }
    );
    startMyVideo();

    socketRef.current.emit("join", { userId: donorId || ngoId });

    // Socket event listeners
    socketRef.current.on("joined", (allUsers: Record<string, any>) => {
      console.log({ allUsers });
      setUsers(allUsers);
    });

    socketRef.current.on("user-assigned", (data: { userId: string }) => {
      setUserId(data.userId);
      // console.log(`You are assigned as: ${data.userId}`);

      // Determine remote user
      const remoteUserName = data.userId === "User1" ? "User2" : "User1";
      setRemoteUser(remoteUserName);
    });

    socketRef.current.on("answer", async ({ answer }: WebRTCAnswer) => {
      // console.log(`Received WebRTC answer from ${from}`, answer);
      if (missedCallTimeoutRef.current) {
        clearTimeout(missedCallTimeoutRef.current);
        missedCallTimeoutRef.current = null;
        console.log("🛑 Cleared 30s missed call timeout");
      }

      setCallStatus("connected"); // New status
      callConnectedRef.current = true;

      if (!peerConnectionRef.current) {
        console.warn("⚠️ PeerConnection was null — creating a new one");
        await createPeerConnection();
      }

      try {
        console.log("Setting remote description for answer...");
        await peerConnectionRef.current?.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        console.log("WebRTC connection established!");

        callStartTimeRef.current = Date.now();
        console.log(
          new Date(callStartTimeRef.current).toLocaleString(),
          "Startime>>>>>>>>>>>>>>>>>>"
        );

        // Process any pending ICE candidates after a short delay
        setTimeout(processPendingIceCandidates, 500);
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    });

    socketRef.current.on(
      "icecandidate",
      async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
        // console.log("📩 Received ICE Candidate:", candidate);

        if (!peerConnectionRef.current?.remoteDescription) {
          console.warn(
            "⚠️ ICE candidate received before remote description. Storing for later."
          );
          pendingIceCandidatesRef.current.push(candidate);
        } else {
          try {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
            // console.log("ICE candidate added successfully");
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
          }
        }
      }
    );

    socketRef.current.on("call-accepted", async ({ to }: CallRequest) => {
      // console.log(`${from} accepted the call. Proceeding with connection...`);

      setIsCallInProgress(true);

      if (!peerConnectionRef.current) {
        await createPeerConnection();
      }

      // console.log("Creating WebRTC offer...");
      pendingIceCandidatesRef.current.forEach((candidate) => {
        // console.log("📤 Sending ICE candidate to:", remoteUser);
        socketRef.current?.emit("icecandidate", {
          candidate,
          from: donorId,
          to,
          ngoId,
        });
      });

      pendingIceCandidatesRef.current = [];
    });

    socketRef.current.on("call-ended", () => {
      endCall();
      setNotification({ type: null, user: null });
    });

    socketRef.current.on("call-canceled", ({ from }: { from: string }) => {
      console.log(`Call from ${from} was canceled before you could answer.`);
      setNotification({ type: null, user: null });
    });

    socketRef.current.on("missed-call", ({ caller }: { caller: string }) => {
      console.log(`Missed call from ${caller}`);
      setNotification({ type: "missed", user: caller });
    });

    socketRef.current.on("call-rejected", ({ from }: CallRequest) => {
      setCallStatus("");
      logCallHistory("rejected");
      console.log(`NGO ${from} rejected your call`);
      setNotification({ type: null, user: null });
      setTimeout(() => {
        endCall();
        navigate(-1);
      }, 2500);
    });

    // Check URL parameters for notification actions
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");
    const callerParam = urlParams.get("caller");

    if (action === "answer" && callerParam) {
      console.log("Auto-answering call from:", callerParam);
      // Will be handled once the user is logged in
      window.pendingAutoAnswer = callerParam;
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  // Initialize local media stream
  // useEffect(() => {
  //   startMyVideo();
  // }, []);

  // Function to create a PeerConnection
  const createPeerConnection = async (
    remoteTargetId?: string
  ): Promise<RTCPeerConnection> => {
    // const iceServers = await getTwilioTurnServers();

    const config: RTCConfiguration = {
      iceServers: [
        // ...iceServers, // This spreads all the Twilio servers
        {
          urls: "stun:stun.l.google.com:19302", // Fallback STUN server
        },
      ],
    };

    peerConnectionRef.current = new RTCPeerConnection(config);
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        pendingIceCandidatesRef.current.push(event.candidate);

        const target = remoteTargetId;
        console.log(
          "remote user>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",
          target
        );

        // 🔁 Emit right away if socket and remote user exist
        if (socketRef.current && target) {
          console.log("📤 Sending ICE candidate to:", target);
          socketRef.current.emit("icecandidate", {
            candidate: event.candidate,
            from: donorId,
            to: target,
            ngoId,
          });
        }
      } else {
        console.log("✅ ICE gathering complete");
      }
    };

    if (localStreamRef.current) {
      // Check if tracks are already added
      localStreamRef.current.getTracks().forEach((track) => {
        console.log("🚀 Adding local track:", track.kind);
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionRef.current.ontrack = function (event) {
      console.log("Remote track received:", event.streams[0]);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.onloadedmetadata = () => {
          remoteVideoRef.current?.play().catch((err) => {
            console.error("🚨 Error playing remote video:", err);
          });
        };

        console.log(
          "✅ Remote video element updated. Stream ID:",
          event.streams[0].id
        );

        // Debugging: Check if the stream contains video tracks
        const videoTracks = event.streams[0].getVideoTracks();

        if (videoTracks.length > 0) {
          console.log("🎥 Video track found:", videoTracks[0]);
        } else {
          console.warn("⚠️ No video tracks found in received stream!");
        }

        // Debugging: Check if the video element is actually displaying the stream
        setTimeout(() => {
          if (remoteVideoRef.current?.videoWidth === 0) {
            console.warn(
              "⚠️ Remote video element is not displaying video! Check media permissions."
            );
            endCall();
          } else {
            console.log("✅ Remote video is displaying correctly.");
          }
        }, 1000);
      } else {
        console.warn("⚠️ Remote video element is null!");
      }
    };

    return peerConnectionRef.current;
  };

  // Function to process pending ICE candidates
  const processPendingIceCandidates = async () => {
    if (!peerConnectionRef.current) return;

    console.log(
      `Processing ${pendingIceCandidatesRef.current.length} pending ICE candidates`
    );

    const promises = pendingIceCandidatesRef.current.map(async (candidate) => {
      try {
        await peerConnectionRef.current?.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
        console.log("Stored ICE candidate added successfully");
        return true;
      } catch (error) {
        console.error("Error adding stored ICE candidate:", error);
        return false;
      }
    });

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value === true
    ).length;
    console.log(
      `Successfully added ${successCount} of ${pendingIceCandidatesRef.current.length} ICE candidates`
    );

    // Clear the array
    pendingIceCandidatesRef.current = [];
  };

  // Function to start local video
  const startMyVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
      });
      console.log("🎥 Local stream obtained:", stream);
      console.log({ stream });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play();
      }
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          console.log(`➕ Adding track to PeerConnection: ${track.kind}`);
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }
      setIsCameraOn(true);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        console.log("✅ Local video track found:", videoTrack);
      } else {
        console.warn("⚠️ No video track found in local stream!");
      }
    } catch (error) {
      console.log("error in startMyVideo", error);
    }
  };

  // Function to toggle audio
  const toggleAudio = () => {
    if (!localStreamRef.current) return;

    const newState = !isAudioOn;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = newState;
    });

    setIsAudioOn(newState);
  };

  // Function to toggle camera
  const toggleCamera = async () => {
    try {
      if (isCameraOn) {
        // Disable camera instead of stopping track
        localStreamRef.current?.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });

        // Update UI to show camera is off
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }

        // Notify peer that video is muted
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");
          if (videoSender && videoSender.track) {
            videoSender.track.enabled = false;
          }
        }

        setIsCameraOn(false);
      } else {
        // Enable camera
        let stream: MediaStream;

        // Reuse existing stream if available
        if (localStreamRef.current) {
          stream = localStreamRef.current;

          // Get new video track
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
              facingMode: "user",
            },
            audio: false, // We'll handle audio separately
          });

          // Replace the video track in our existing stream
          const oldVideoTrack = stream.getVideoTracks()[0];
          if (oldVideoTrack) {
            stream.removeTrack(oldVideoTrack);
            oldVideoTrack.stop();
          }

          const newVideoTrack = newStream.getVideoTracks()[0];
          newStream.getAudioTracks().forEach((track) => track.stop()); // Cleanup
          stream.addTrack(newVideoTrack);
        } else {
          // Create new stream if none exists
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: isAudioOn,
          });
          localStreamRef.current = stream;
        }

        // Update local video display
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Update peer connection
        if (peerConnectionRef.current) {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            const senders = peerConnectionRef.current.getSenders();
            const videoSender = senders.find((s) => s.track?.kind === "video");

            if (videoSender) {
              await videoSender.replaceTrack(videoTrack);
            } else {
              peerConnectionRef.current.addTrack(videoTrack, stream);
            }
          }
        }

        setIsCameraOn(true);
      }
    } catch (error) {
      console.error("Error toggling camera:", error);
      // Fallback to audio-only if video fails
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach((track) => {
            track.stop();
          });
          localStreamRef.current.addTrack(audioStream.getAudioTracks()[0]);
        }
        setIsCameraOn(false);
        alert("Could not access camera. Continuing with audio only.");
      } catch (audioError) {
        console.error("Error accessing microphone:", audioError);
        alert("Could not access camera or microphone.");
      }
    }
  };

  const startCall = async (toUserId: string) => {
    console.log(`Calling ${toUserId}...`);
    setRemoteUser(toUserId);
    setNotification({ type: "outgoing", user: toUserId });
    // New status
    setIsCallInProgress(true);

    if (socketRef.current) {
      socketRef.current.emit("call-request", {
        name: donorName,
        from: donorId,
        to: ngoId,
        ngoId: ngoId,
        email,
      });
    }

    if (!peerConnectionRef.current) {
      await createPeerConnection(toUserId);
    }

    try {
      const offer = await peerConnectionRef.current?.createOffer();
      await peerConnectionRef.current?.setLocalDescription(offer);

      if (socketRef.current) {
        socketRef.current.emit("offer", {
          from: donorId,
          to: ngoId,
          offer,
          ngoId: ngoId,
          name: donorName,
        });
      }
    } catch (error) {
      console.error("Error creating or sending offer:", error);
    }

    callTimeoutRef.current = setTimeout(() => {
      console.log("⏰ Max call duration reached. Ending call.");
      socketRef.current?.emit("call-ended", {
        from: donorId,
        to: ngoId,
        reason: "timeout",
      });
      endCall();
    }, 1800000);

    setTimeout(() => {
      if (peerConnectionRef.current?.remoteDescription) {
        // Only if call is still connected
      }
    }, 1800000);

    missedCallTimeoutRef.current = setTimeout(() => {
      if (!peerConnectionRef.current?.remoteDescription) {
        console.warn("No answer received within 30 seconds. Ending call.");
        logCallHistory("missed");
        endCall();
      }
    }, 60000);
  };
  // Function to end the call
  const endCall = () => {
    if (callEndedRef.current) return;
    callEndedRef.current = true;
    console.log("Executing complete call cleanup");

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
    }
    if (missedCallTimeoutRef.current) {
      clearTimeout(missedCallTimeoutRef.current);
    }

    setIsCallInProgress(false);
    setRemoteUser(null);
    setNotification({ type: null, user: null });
    setIsCameraOn(false);
    setIsAudioOn(false);

    // 🧠 Smart logging based on connection status
    try {
      // 🧠 Smart logging based on connection status
      if (callConnectedRef.current && callStartTimeRef.current) {
        console.log("Call was answered — logging call history with duration");
        logCallHistory("answered"); // Await the logging
      } else if (!callConnectedRef.current && callStatus === "calling") {
        console.log("Donor exited early — logging missed call.");
        logCallHistory("missed"); // Await the logging
      }
    } catch (error) {
      console.error("Failed to log call history:", error);
    }

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      console.log(`Stopping ${tracks.length} local tracks`);

      tracks.forEach((track) => {
        console.log(`Stopping track: ${track.kind} with ID: ${track.id}`);
        track.stop();
        track.enabled = false;
      });

      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        console.log(`Explicitly stopping ${videoTracks.length} video tracks`);
        videoTracks.forEach((track) => track.stop());
      }

      localStreamRef.current = null;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
        localVideoRef.current.pause();
        localVideoRef.current.load();
      }
    }

    if (peerConnectionRef.current) {
      console.log("Closing PeerConnection...");
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onsignalingstatechange = null;
      peerConnectionRef.current.onnegotiationneeded = null;

      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteVideoRef.current) {
      if (remoteVideoRef.current.srcObject) {
        const remoteStream = remoteVideoRef.current.srcObject as MediaStream;
        remoteStream.getTracks().forEach((track) => track.stop());
      }
      remoteVideoRef.current.srcObject = null;
      remoteVideoRef.current.pause();
      remoteVideoRef.current.load();
    }

    if (socketRef.current) {
      socketRef.current.emit("call-ended", {
        from: donorId,
        to: ngoId,
        reason: "manual",
      });
    }

    setTimeout(() => {
      navigate(-1);
    }, 100);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Force a permissions failure to reset the camera state
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: { width: 1, height: 1 } })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
          console.log("Permissions reset successful");
        })
        .catch((e) => {
          console.log(
            "Permissions reset through failure - this is expected",
            e
          );
        });
    }
  };

  // Render the component
  return (
    <div className="active-call-overlay">
      {callStatus === "calling" && (
        <div className="video-call-loader-container">
          {/* <svg className="call-status-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg> */}

          {/* Pulsing dots loader */}
          <div className="video-call-loader">
            <div className="video-call-loader-dot"></div>
            <div className="video-call-loader-dot"></div>
            <div className="video-call-loader-dot"></div>
          </div>
        </div>
      )}
      <div className="active-call-container">
        <div className="active-call-main">
          <div className="active-call-video">
            <video
              autoPlay
              muted
              ref={localVideoRef}
              className="video-stream self-stream"
            />
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="video-stream"
            />
          </div>

          {/* Call Controls */}
          <div className="call-controls">
            <button
              onClick={toggleAudio}
              className={`call-control-button mute ${
                !isAudioOn ? "active" : ""
              }`}
            >
              {isAudioOn ? (
                <FaMicrophone size={25} />
              ) : (
                <FaMicrophoneSlash size={25} color="red" />
              )}
            </button>
            <button
              onClick={toggleCamera}
              className={`call-control-button video ${
                !isCameraOn ? "active" : ""
              }`}
            >
              {isCameraOn ? (
                <FaVideo size={25} />
              ) : (
                <FaVideoSlash size={25} color="red" />
              )}
            </button>

            <button
              onClick={endCall}
              // disabled={!isCallInProgress}
              className="call-control-button end"
            >
              <FaPhoneSlash size={25} />
            </button>
          </div>

          {/* Call Timer */}
          <div className="call-timer">{/* {callDuration} */}</div>

          {/* Call Info */}
          <div className="call-info">
            {/* <span className="call-name">{callerName}</span> */}
          </div>
        </div>
      </div>

      {/* Notification Overlays */}
    </div>
  );
};

export default VideoCallingApp;
