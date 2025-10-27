module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [], // Make sure this is an array, not nested incorrectly
  };
};
