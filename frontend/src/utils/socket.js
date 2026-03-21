import { io } from 'socket.io-client';

// The socket connects to the same origin, so we default to '/' or window.location.origin
const socket = io('/', {
  autoConnect: false,
});

export default socket;
