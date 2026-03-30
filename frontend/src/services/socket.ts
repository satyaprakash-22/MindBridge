import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};

export const getSocket = () => {
  return socket || initSocket();
};

export const joinChat = (chatId) => {
  const sock = getSocket();
  sock.emit('join_chat', { chatId });
};

export const sendMessage = (chatId, sender, content) => {
  const sock = getSocket();
  sock.emit('send_message', { chatId, sender, content });
};

export const onMessageReceived = (callback) => {
  const sock = getSocket();
  sock.on('receive_message', callback);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
