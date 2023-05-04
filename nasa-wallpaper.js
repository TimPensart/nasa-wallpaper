import { getWallpaper, setWallpaper } from "wallpaper";
import http from "https";
import fs from "fs";

let queryParams = "";
let randomPic = false;
process.argv.forEach(function (val, index, array) {
  if (val == "random") {
    randomPic = true;
    queryParams = "&count=1";
  }
});

const apiKey = process.env.API_KEY;
// const date = "2022-05-11";
let url = "https://api.nasa.gov/planetary/apod?api_key=" + apiKey + queryParams;

console.log(url);

function getNasaData() {
  return new Promise(function (resolve, reject) {
    http.get(url, (res) => {
      if (res.statusCode === 200) {
        let rawData = "";

        res.on("data", (chunk) => {
          rawData += chunk;
        });

        res.on("end", () => {
          const data = randomPic ? JSON.parse(rawData)[0] : JSON.parse(rawData);
          if (data.media_type == "image") {
            resolve(data);
          } else {
            reject("media_type is not of type image");
          }
        });
      } else {
        reject("GET request failed with statuscode: " + res.statusCode);
      }
    });
  });
}

function downloadPicOfTheDay(imageURL) {
  return new Promise(function (resolve, reject) {
    http.get(imageURL, (res) => {
      if (res.statusCode === 200) {
        // download and write image url content to a jpg file
        const writeStream = fs.createWriteStream("wallpaper-download.jpg");
        res.pipe(writeStream);

        writeStream.on("finish", () => {
          writeStream.close();
          console.log("Download Completed!");
          resolve();
        });
      } else {
        reject("image url returned statuscode: " + res.statusCode);
      }
    });
  });
}

getNasaData().then(
  (value) =>
    downloadPicOfTheDay(value.hdurl ? value.hdurl : value.url).then(
      () => {
        console.log(value.explanation);
        const date = new Date().toLocaleDateString().replace(/\//g, "-");
        const oldPath = "wallpaper-download.jpg";
        const newPath = "/Users/timpensart/Pictures/Wallpapers/wallpaper_current_" + date + ".jpg";

        fs.rename(oldPath, newPath, function (err) {
          if (err) throw err;
          console.log("Successfully moved image");
          setWallpaper(newPath);
        });
      },
      (error) => console.log(error)
    ),
  (error) => console.log(error)
);
