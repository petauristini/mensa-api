import express from "express";
import fetch_menu from "./mensa.js";
import documentation from "../documentation.json" assert { type: "json" };

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const getMenuByDay = async (day, inedible) => {
  const menu = await fetch_menu(inedible);
  if (!day) return menu;
  let index;
  switch (day) {
    case "today":
      index = 0;
      break;
    case "tomorrow":
      index = 1;
      break;
    default:
      if (!(day in [0, 1, 2, 3, 4])) {
        return null;
      }
      index = day;
  }
  return menu[index];
};

const checkForProperty = async (menu, property) => {
  if (menu.length > 1) {
    let response = [];
    menu.forEach((element) => {
      const propertyIsTrue = element.items[0][property];
      response.push({title: element.items[0].title, [property]: propertyIsTrue});
    });
    return response;
  }
  const propertyIsTrue = menu.items[0][property];
  return {title: menu.items[0].title, [property]: propertyIsTrue};
};

app.get("/", (req, res) => {
    res.send(documentation);
});

app.get("/menu/:day?", async (req, res) => {
  res.json(await getMenuByDay(req.params.day, req.body.inedible));
});

app.get("/vegan/:day?", async (req, res) => {
  const menu = await getMenuByDay(req.params.day, req.body.inedible);
  const response = await checkForProperty(menu, "vegan");
  res.json(response);
});

app.get("/edible/:day?", async (req, res) => {
  const menu = await getMenuByDay(req.params.day, req.body.inedible);
  const response = await checkForProperty(menu, "edible");
  res.json(response);
});

app.listen(3000);
