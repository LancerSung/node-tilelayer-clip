const url = require('url');
const Canvas = require('canvas');
const express = require('express');
const router = express.Router();
const AjaxUtil = require('../src/AjaxUtil');
const ImageUtil = require('../src/ImageUtil');
const drawutil = require('../src/drawUtil');
const Turf = require('../src/turf');



/**
 *  成功提示
 * @param {*} res
 * @param {*} binaryData
 */
function successRes(res, binaryData) {
    res.writeHead(200, {
        'Content-Type': 'image/png'
    });
    res.write(binaryData, 'binary');
    res.end();
}

/**
 * 错误提示
 * @param res
 */
function errRes(res, message) {
    const TILESIZE = 256;
    message = message || 'token';
    const canvas = new Canvas(TILESIZE, TILESIZE);
    const context = canvas.getContext('2d');
    context.save();
    context.fillStyle = 'red';
    context.font = '30px Microsoft YaHei';
    context.fillText(message, 100, 100);
    context.strokeRect(0, 0, TILESIZE, TILESIZE);
    context.restore();
    const str = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, '');
    const binaryData = new Buffer(str, 'base64');
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.write(binaryData, 'binary');
    res.end();
}


router.get('/tilelayer', function (req, res) {
    const pararmObj = url.parse(req.url, true).query;
    if (!pararmObj) {
        errRes(res, 'sure your param');
        return;
    }
    const { x, y, z, lnglats } = pararmObj;
    const imagePath = './images/' + z + '/' + x + '/' + y + '.png';
    ImageUtil.getImage(imagePath, function (binaryData) {
        if (binaryData) {
            successRes(res, binaryData);
            return;
        } else {
            //范围外的直接返回默认图片
            if (Turf.disjoint(lnglats)) {
                errRes(res, '超出边界');
                return;
            } else {
                const url = `https://mt2.google.cn/maps/vt?lyrs=m&hl=zh-CN&gl=CN&x=${x}&y=${y}&z=${z}`;
                AjaxUtil.getImage(url).then(function readData(result) {
                    if (!result) {
                        errRes(res, 'error');
                        return;
                    }
                    //包含的直接返回图片
                    if (Turf.contains(lnglats)) {
                        const _binaryData = new Buffer(result, 'base64');
                        successRes(res, _binaryData);
                        ImageUtil.saveImage(_binaryData, {
                            x, y, z
                        });
                    } else {
                        //图片剪裁
                        const canvas = drawutil.titleDraw(lnglats, result);
                        const str = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, '');
                        const _binaryData = new Buffer(str, 'base64');
                        successRes(res, _binaryData);
                        ImageUtil.saveImage(_binaryData, {
                            x, y, z
                        })
                    }

                });
            }
        }
    });
});

module.exports = router;