const boditrax = require("./boditrax");

exports.handler = async (event, context, callback) => {
  try {
    const headers = event.headers;
    if (!headers["x-boditrax-email"]) {
      return { statusCode: 400, body: "Missing x-boditrax-email header" };
    }
    if (!headers["x-boditrax-email"]) {
      return { statusCode: 400, body: "Missing x-boditrax-email header" };
    }
    const data = await boditrax(
      headers["x-boditrax-email"],
      headers["x-boditrax-password"]
    );
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    throw err;
  }
};
