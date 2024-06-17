import axios from "axios";
import crypto from "crypto";
import cheerio from "cheerio";

const mensaUrl =
  "https://kantonsschule-alpenquai.sv-restaurant.ch/de/menuplan/";
const mensaUrlRobots =
  "https://kantonsschule-alpenquai.sv-restaurant.ch/robots.txt";
const mensaAgent =
  "Mozilla/5.0 (compatible; Node.js-axios/0.21; This bot automatically downloads the menu)";

const check_robots = async () => {
  const response = await axios.get(mensaUrlRobots, {
    headers: {
      "User-Agent": mensaAgent,
    },
  });
  const hash = crypto.createHash("sha256").update(response.data).digest("hex");
  if (
    hash !== "64f40283f2f694942ae7bff26e774ef3dafb41949d75a7e7c23d5db1bee217b2"
  ) {
    console.log("mensa robots.txt has changed");
    return false;
  }
  return true;
};

const fetch_menu = async (inedible=[]) => {
  if (!(await check_robots())) return null;

  const response = await axios.get(mensaUrl, {
    headers: {
      "User-Agent": mensaAgent,
    },
  });

  const $ = cheerio.load(response.data);

  const menu = [];

  $(".menu-plan-grid").each(function (index, tab) {
    let menu_tab = {
      day: "",
      date: "",
      items: [
        { title: "", description: "", vegan: false, edible: true },
        { title: "", description: "", vegan: false, edible: true },
        { title: "", description: "", vegan: false, edible: true },
      ],
    };
    $(this)
      .find(".menu-item")
      .each(function (index) {
        menu_tab["items"][index].title = $(this)
          .find(".menu-title")
          .text()
          .trim();
        menu_tab["items"][index].description = $(this)
          .find(".menu-description")
          .text()
          .trim()
          .replace(/\n/g, " ");
        menu_tab["items"][index].vegan =
          $(this).find(".label-vegan").length > 0;
        if (inedible.includes(menu_tab["items"][index].title) || !menu_tab["items"][index].vegan) {
          menu_tab["items"][index].edible = false;
        }
      });

    const dayInfo = $(".day-nav ul")
      .find(`li:nth-child(${index + 1}) label`)
      .text()
      .trim()
      .split(/\s+/);
    menu_tab.day = dayInfo[0];
    menu_tab.date = dayInfo[1];

    menu.push(menu_tab);
  });
  return menu;
};

export default fetch_menu;
