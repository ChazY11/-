exports.main = async (event) => {
  return {
    ok: true,
    message: 'identity function scaffold ready',
    action: event?.action || 'unknown',
    receivedAt: Date.now(),
  };
};
