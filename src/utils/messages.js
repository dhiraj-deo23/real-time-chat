const generateMessage = (text) => {
  return {
    text,
    createdAt: new Date().toLocaleTimeString(),
  };
};

const locationMessage = (url) => {
  return {
    url,
    createdAt: new Date().toLocaleTimeString(),
  };
};

module.exports = {
  generateMessage,
  locationMessage,
};
