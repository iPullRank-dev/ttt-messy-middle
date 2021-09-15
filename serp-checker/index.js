const fs = require("fs");
const axios = require("axios");
const urlADVANCE =
  "https://api.dataforseo.com/v3/serp/google/organic/live/advanced";

require("dotenv").config();

exports.serpChecker = async (req, res) => {
  try {
    let kw = req.query.keyword || "";
    let domain = req.query.domain || "";
    if (kw == "") {
      res.status(403).send({ message: "No Keyword" });
    }

    // BE SURE TO RENAME .env.example to .env and replace with account details from dataforseo.com
    let email = process.env.email;
    let password = process.env.password;

    // dataforseo location data
    // https://docs.dataforseo.com/v3/serp/google/locations/?bash
    await axios({
      method: "post",
      url: urlADVANCE,
      auth: {
        username: process.env.email,
        password: process.env.password,
      },
      data: [
        {
          keyword: encodeURI(kw),
          language_code: "en",
          location_code: 2840, // default to using United States but can be changed
        },
      ],
      headers: {
        "content-type": "application/json",
      },
    }).then(async function (response) {
      // parse the payload from dataforseo and only focus on the SERP items
      var [result] = response["data"]["tasks"][0].result;

      let position_universal = "";
      let position_absolute = "";
      let serpUrl = "";
      let title = "";
      let description = "";
      let ranks = [];

      // loop over every SERP result checking if domain is in url
      for await (serpBlock of result.items) {
        // console.log("SERPBLOCK", domain, serpBlock.url);
        if (serpBlock && serpBlock.url) {
          if (domain == "") {
            // No Filter
            // If you do not pass in a domain, then it's ALL the results from rankings
            if (serpBlock.type == "organic") {
              position_universal = serpBlock.rank_group;
              position_absolute = serpBlock.rank_absolute;
              serpUrl = serpBlock.url;
              title = serpBlock.title;
              description = serpBlock.description;
              ranks.push({
                type: serpBlock.type,
                pageTitle: "",
                pageDescription: "",
                serpTitle: title,
                serpDescription: description,
                url: serpUrl,
                position_universal,
                position_absolute,
              });
            }
          } else {
            // use the domain to filter and only get results that rank
            if (
              serpBlock.url.includes(`https://${domain}`) || // https
              serpBlock.url.includes(`https://www.${domain}`) || // httpswww
              serpBlock.url.includes(`http://${domain}`) || // http
              serpBlock.url.includes(`https://www.${domain}`) // httpwww
            ) {
              if (serpBlock.type == "organic") {
                position_universal = serpBlock.rank_group;
                position_absolute = serpBlock.rank_absolute;
                serpUrl = serpBlock.url;
                title = serpBlock.title;
                description = serpBlock.description;
                ranks.push({
                  type: serpBlock.type,
                  pageTitle: "",
                  pageDescription: "",
                  serpTitle: title,
                  serpDescription: description,
                  url: serpUrl,
                  position_universal,
                  position_absolute,
                });
              }
            }
          }
        }
      }
      res.status(200).send({ ranks: ranks });
    });
  } catch (err) {
    console.log("err", err);
    res.status(500).send(err.message);
  } finally {
    process.exit(0);
  }
};
