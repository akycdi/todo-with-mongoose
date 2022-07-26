const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config()
//console.log(process.env) 

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect(`mongodb+srv://arunkumar36824:${process.env.password}@cluster.rax7nw0.mongodb.net/test`, { useNewUrlParser: true })
.then(console.log("Runnings"))
.catch((e) => {
  console.log(e);
});

const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "To do list"
});
const item2 = new Item({
  name: "You can add and delete"
});
const item3 = new Item({
  name: "Work from home"
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        }
        else {
          console.log("added to database");
        }
      })
      res.redirect("/");
    }
    else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  })
});

app.post("/", function (req, res) {

  const str = req.body.newItem;
  const listname = req.body.list;

  const item = new Item({
    name: str
  })

  if (listname === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({ name: listname }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listname);
    })
  }

});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listname = _.trim(req.body.listTitle);
  console.log(listname, " length :", listname.length);
  if (listname === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("Deleted ");
        res.redirect("/");
      }
    });
  }
  else {
    List.findOneAndUpdate({ name: listname }, { $pull: { items: { _id: checkedItemId } } })
      .then(() => {
        res.redirect(`/${listname}`);
      })
      .catch((e) => console.log(e));
  }

});

app.get("/:listName", (req, res) => {
  List.findOne({ name: req.params.listName }, (err, listFound) => {
    if (!err) {
      if (!listFound) {
        const list = new List({
          name: req.params.listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + req.params.listName);
      }
      else {
        res.render("list", { listTitle: req.params.listName, newListItems: listFound.items })
      }
    }
  });
})

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
