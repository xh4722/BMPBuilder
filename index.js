import JsBarcode from './utils/jsbarcode.all.min';
import QRCode from 'qrcode';

import { genMonochromeBMP, genBitmapImage, scaleCanvas } from './library';

/**
 * 位图构建对象
 * @method BMPBuilder
 */
class BMPBuilder {
    /**
     * 生成位图 base64 数据
     * @method createBMPData
     * @param {String} url
     * @param {Object} options
     */
    createBMPData(url, options) {
        let { align } = options;

        /* 图片最大宽度 */
        let maxWidth = 350;

        return new Promise((resolve, reject) => {
            let image = new Image();
            image.crossOrigin = 'anonymous';
            image.src = url;
            // 图片加载完成
            image.onload = () => {
                /* 图片尺寸控制 */
                let imageWidth = maxWidth > image.width ? image.width : maxWidth;
                let imageHeight = image.height;
                // 图片高度缩放
                if(maxWidth < image.width) {
                    imageHeight = Math.round(maxWidth / image.width * image.height);
                }

                let canvas = document.createElement('canvas');
                canvas.width = image.width > maxWidth ? image.width : maxWidth;
                canvas.height = image.height;

                let context = canvas.getContext('2d');
                context.fillStyle = 'white';
                context.fillRect(0, 0, canvas.width, canvas.height);

                let left = 0;
                // 居中
                if(align == 'center') {
                    left = Math.floor((maxWidth - imageWidth) / 2);
                }// 居右
                else if(align == 'right') {
                    left = maxWidth - imageWidth;
                }
                context.drawImage(
                    image,
                    left,
                    0
                );

                /* 缩放画布 */
                canvas = scaleCanvas(canvas, 350, imageHeight);

                let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                /* 彩图转单色位图数据 */
                let buffer = imageData.data;
                for(let i = 0, len = buffer.length; i < len; i += 4) {
                    let luma = buffer[i] * 0.3 + buffer[i + 1] * 0.59 + buffer[i + 2] * 0.11;
                    // 阈值判断
                    luma = luma < 127 ? 0 : 255;

                    buffer[i] = luma;
                    buffer[i + 1] = luma;
                    buffer[i + 2] = luma;
                }
                // 生成单色位图数据
                let data = genMonochromeBMP(imageData);
                resolve(data);
            };
            // 图片加载异常
            image.onerror = (err) => {
                reject(err);
            };
        });
    }

    /**
     * 生成条形码位图
     * @method toBarcode
     * @param {String} value
     * @param {Object} options
     */
    toBarcode(value, options={width: 350, height: 80, align: 'center'}) {
        let { height } = options;

        JsBarcode('#img_barcode', value, {
            height,
            width: 2,
            // 条码打印不清晰，不显示条码值
            displayValue: false,
            fontSize: 14,
            margin: 0
        });

        return this.createBMPData(document.getElementById('img_barcode').src, options);
    }

    /**
     * 生成二维码位图
     * @method toQRCode
     * @param {String} value
     */
    toQRCode(value, options={width:250, height:250, align: 'center'}) {
        return new Promise((resolve, reject) => {
            QRCode.toDataURL(value, {
                scale: 4
            }, (err, url) => {
                if(err) {
                    reject(err);
                    return;
                }

                this.createBMPData(url, options)
                    .then(resolve)
                    .catch(err => reject(err));
            });
        });
    }

    /**
     * 根据 url 生成位图格式的 base64 数据
     * @method toBMP
     * @param {String} url
     * @param {Object} options
     */
    toBMP(url, options={width:250, height:250, align:'center'}) {
        options = Object.assign(options, {
            zoom: true
        });
        return this.createBMPData(
            //url,
            'https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=1668561120,3275734032&fm=27&gp=0.jpg',
            //'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=2008199100,853930743&fm=27&gp=0.jpg',
            options
        );
    }

}

export default new BMPBuilder();
