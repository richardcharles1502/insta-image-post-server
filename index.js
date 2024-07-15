const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const fse = require("fs-extra");
const multer = require("multer");
const path = "./user.json";
const uploadpath = require("path");
const port = 5000;

// Middleware to handle CORS and preflight requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Update this to your live React app URL if needed
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.status(200).end(); // Respond with 200 status for OPTIONS requests
    return;
  }
  next();
});

app.use(bodyParser.json());

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

app.listen(port, () => {
  console.log("Listening to port: " + port);
});

app.get("/", (req, res) => {
  res.send("welcome!!!");
});

app.post("/registeruser", (req, res) => {
  const userdata = req.body;
  if (!userdata.email) {
    res.status(400).send({ message: "Invalid user datas" });
  } else {
    const readfile = (path) => {
      if (fs.existsSync(path)) {
        const data = fs.readFileSync(path);
        return JSON.parse(data);
      }
      return {};
    };
    const append = (key, data, path) => {
      let jsondata = readfile(path);
      if (!jsondata[key]) {
        jsondata[key] = [];
        jsondata[key].push(data);
        fs.writeFileSync(path, JSON.stringify(jsondata, null, 2));
        return { status: 200, message: "Success" };
      } else {
        return { status: 500, message: "User already exist" };
      }
    };
    let response = append(userdata.email, userdata, path);
    res.status(response.status).send({ message: response.message });
  }
});

app.post("/loginuser", (req, res) => {
  const readfile = (path) => {
    if (fs.existsSync(path)) {
      const data = fs.readFileSync(path);
      return JSON.parse(data);
    }
    return {};
  };
  let jsondata = readfile(path);
  if (req.body.email in jsondata) {
    let email = req.body.email;
    // testing email
    console.log('req mail: ',email)
    console.log('read mail: ',jsondata[email][0].password)
    if (req.body.password === jsondata[email][0].password) {
      res.status(200).send({ message: "Success" });
    } else {
      res.status(401).send({ message: "Invalid pass" });
    }
  } else {
    res.status(500).send({ message: "Undefined user" });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

app.post("/fileupload", upload.single("file"), (req, res) => {
  try {
    // move file inside specific folder
    const uploadDir = uploadpath.join(
      __dirname,
      "uploads/",
      req.body.email,
      "/"
    );
    const tempDir = uploadpath.join(__dirname, "/uploads", "/");
    const filename = req.file.filename;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    fse.copy(tempDir + filename, uploadDir + filename, (err) => {
      if (err) {
        res.status(500).send({ message: err });
      }
      fs.unlinkSync(tempDir + filename);
      res
        .status(200)
        .send({ message: "File uploaded successfully", file: req.file });
    });
  } catch (error) {
    res.status(500).send({ message: "Error uploading file" });
  }
});

app.get("/getallimages/:email", (req, res) => {
  const { email } = req.params;
  let filepath = uploadpath.join(__dirname, "./uploads/", email);
  let allfiles;
  if (fs.existsSync(filepath)) {
    allfiles = fs.readdirSync(filepath);
  } else {
    allfiles = "";
  }
  res.status(200).send({ allfiles });
});
