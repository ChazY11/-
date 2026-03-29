exports.main = async (event) => {
  return {
    ok: true,
    message: 'rooms function scaffold ready',
    action: event?.action || 'unknown',
    receivedAt: Date.now(),
  };
};
