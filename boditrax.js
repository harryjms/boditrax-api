const { load } = require("cheerio");
const request = require("request");

async function main(email, password) {
  const jar = request.jar();
  const { response, body } = await new Promise((resolve, reject) =>
    request(
      {
        url: "https://cp.boditrax.com/dashboard/composition",
        jar,
      },
      (err, res, body) => {
        if (err) {
          return reject(err);
        }
        resolve({ response: res, body });
      }
    )
  );

  let $ = load(body);
  const formEl = $("form#login-form");

  const reqToken = $("input[name='__RequestVerificationToken']").val();

  const loginRes = await new Promise((resolve, reject) =>
    request(
      {
        url: "https://identity.boditrax.com" + formEl.attr("action"),
        method: "POST",
        formData: {
          __RequestVerificationToken: reqToken,
          email,
          password,
        },
        jar,
      },
      (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      }
    )
  );

  const loginRes2 = await new Promise((resolve, reject) =>
    request(
      {
        url: loginRes.headers.location,
        method: "GET",
        jar,
      },
      (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ response: res, body });
      }
    )
  );

  $ = load(loginRes2.body);

  await new Promise((resolve, reject) => {
    const nextURL = $("form").attr("action");
    const id_token = $('input[name="id_token"]').val();
    const scope = $('input[name="scope"]').val();
    const state = $('input[name="state"]').val();
    const session_state = $('input[name="session_state"]').val();
    request(
      {
        url: nextURL,
        method: "post",
        formData: {
          id_token,
          scope,
          state,
          session_state,
        },
        jar,
      },
      (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ response: res, body });
      }
    );
  });

  const printoutResponse = await new Promise((resolve, reject) => {
    request(
      {
        url: "https://cp.boditrax.com/dashboard/consolidated/printout?print=True",
        method: "get",
        jar,
      },
      (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ response: res, body });
      }
    );
  });

  $ = load(printoutResponse.body);

  let baseline = {
    age: $(`#hide-printout .wheel.age`).data(),
    height: $(`#hide-printout .wheel.height`).data(),
    impedance: $(`#hide-printout .wheel.impedance`).data(),
    bodyweight: $(`#hide-printout .wheel.bodyweight`).data(),
    bmi: $(`#hide-printout .wheel.bodymassindex`).data(),
    idealweight: $(`#hide-printout .wheel.idealweight`).data(),
    bmr: $(`#hide-printout .wheel.basalmetabolicrate`).data(),
    metabolicage: $(`#hide-printout .wheel.metabolicage`).data(),
    muscleMass: {
      weight: $(`#hide-printout .composition-material.muscle .weight`).data(
        "value"
      ),
      unit: $(
        `#hide-printout .composition-material.muscle .weight .unit`
      ).text(),
      percentage: $(
        `#hide-printout .composition-material.muscle .percentage`
      ).data("value"),
    },
    fatMass: {
      weight: $(`#hide-printout .composition-material.fat .weight`).data(
        "value"
      ),
      unit: $(`#hide-printout .composition-material.fat .weight .unit`).text(),
      percentage: $(
        `#hide-printout .composition-material.fat .percentage`
      ).data("value"),
    },
    waterMass: {
      weight: $(`#hide-printout .composition-material.water .weight`).data(
        "value"
      ),
      unit: $(
        `#hide-printout .composition-material.water .weight .unit`
      ).text(),
      percentage: $(
        `#hide-printout .composition-material.water .percentage`
      ).data("value"),
    },
    boneMass: {
      weight: $(`#hide-printout .composition-material.bone .weight`).data(
        "value"
      ),
      unit: $(`#hide-printout .composition-material.bone .weight .unit`).text(),
      percentage: $(
        `#hide-printout .composition-material.bone .percentage`
      ).data("value"),
    },
  };

  const trackResponse = await new Promise((resolve, reject) => {
    request(
      {
        url: "https://cp.boditrax.com/dashboard/track",
        method: "get",
        jar,
      },
      (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ response: res, body });
      }
    );
  });

  $ = load(trackResponse.body);
  const times = $("#bottom script")
    .text()
    .replace(/\s/g, "")
    .match(/newDate\((\d*)\)/g)
    .map((s) => s.replace(/newDate\((\d*)\)/g, "$1"));

  return {
    ...baseline,
    date: parseInt(times[times.length - 1]),
  };
}
module.exports = main;
