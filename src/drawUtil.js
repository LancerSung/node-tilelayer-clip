const Canvas = require("canvas");
const Image = Canvas.Image;
const drawUtil = (module.exports = {});
const TILESIZE = 256;
const TURF = require("../src/turf");

//计算像素坐标
function calXY(lnglats, mcoords) {
  const lnglatArray = lnglats.split(",");
  const [minlng, minlat, maxlng, maxlat] = lnglatArray;
  // const xAverage = TILESIZE / (maxlng - minlng);//单位经度对应的像素个数
  // const yAverage = TILESIZE / (maxlat - minlat);//单位纬度对应的像素个数

  //墨卡托
  let mercatorminlng, mercatormaxlng, mercatorminlat, mercatormaxlat;
  const minLngLat = TURF.forward([minlng, minlat]);
  const maxLngLat = TURF.forward([maxlng, maxlat]);
  mercatorminlng = minLngLat[0];
  mercatormaxlng = maxLngLat[0];
  mercatorminlat = minLngLat[1];
  mercatormaxlat = maxLngLat[1];
  const mecatorxAverage = TILESIZE / (mercatormaxlng - mercatorminlng);
  const mecatoryAverage = TILESIZE / (mercatormaxlat - mercatorminlat);
  //墨卡托坐标转屏幕像素
  return mcoords.map(c => {
    const [lng, lat] = c;
    const x = (lng - mercatorminlng) * mecatorxAverage;
    const y = TILESIZE - (lat - mercatorminlat) * mecatoryAverage;
    return [x, y];
  });
}

drawUtil.titleDraw = function(lnglats, imageStr, mcoords) {
  const canvas = new Canvas(TILESIZE, TILESIZE);
  canvas.width = TILESIZE;
  canvas.height = TILESIZE;
  const cxt = canvas.getContext("2d");
  const xys = calXY(lnglats, mcoords);
  drawUtil.clip(cxt, xys, imageStr);
  return canvas;
};

drawUtil.clip = function(cxt, xys, imageStr) {
  cxt.save();
  cxt.beginPath();
  for (let j = 0; j < xys.length; j++) {
    const [x, y] = xys[j];
    if (j == 0) {
      cxt.moveTo(x, y);
    } else {
      cxt.lineTo(x, y);
    }
  }
  cxt.clip();
  const myImage = new Image();
  myImage.src = "data:image/png;base64," + imageStr;
  myImage.width = myImage.height = TILESIZE;
  cxt.drawImage(myImage, 0, 0, TILESIZE, TILESIZE);
  // cxt.closePath();
  // cxt.stroke();
  cxt.restore();
};
