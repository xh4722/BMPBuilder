/**
 * imageData 转24位位图格式
 * @method genBitmapImage
 * @param {Buffer} oData
 **/
export function genBitmapImage(oData) {
    //
    // BITMAPFILEHEADER: http://msdn.microsoft.com/en-us/library/windows/desktop/dd183374(v=vs.85).aspx
    // BITMAPINFOHEADER: http://msdn.microsoft.com/en-us/library/dd183376.aspx
    //

    var biWidth     = oData.width;
    var biHeight    = oData.height;
    var biSizeImage = biWidth * biHeight * 3;
    var bfSize      = biSizeImage + 54; // total header size = 54 bytes

    //
    //  typedef struct tagBITMAPFILEHEADER {
    //  	WORD bfType;
    //  	DWORD bfSize;
    //  	WORD bfReserved1;
    //  	WORD bfReserved2;
    //  	DWORD bfOffBits;
    //  } BITMAPFILEHEADER;
    //
    var BITMAPFILEHEADER = [
        // WORD bfType -- The file type signature; must be "BM"
        0x42, 0x4D,
        // DWORD bfSize -- The size, in bytes, of the bitmap file
        bfSize & 0xff, bfSize >> 8 & 0xff, bfSize >> 16 & 0xff, bfSize >> 24 & 0xff,
        // WORD bfReserved1 -- Reserved; must be zero
        0, 0,
        // WORD bfReserved2 -- Reserved; must be zero
        0, 0,
        // DWORD bfOffBits -- The offset, in bytes, from the beginning of the BITMAPFILEHEADER structure to the bitmap bits.
        54, 0, 0, 0
    ];

    //
    //  typedef struct tagBITMAPINFOHEADER {
    //  	DWORD biSize;
    //  	LONG  biWidth;
    //  	LONG  biHeight;
    //  	WORD  biPlanes;
    //  	WORD  biBitCount;
    //  	DWORD biCompression;
    //  	DWORD biSizeImage;
    //  	LONG  biXPelsPerMeter;
    //  	LONG  biYPelsPerMeter;
    //  	DWORD biClrUsed;
    //  	DWORD biClrImportant;
    //  } BITMAPINFOHEADER, *PBITMAPINFOHEADER;
    //
    var BITMAPINFOHEADER = [
        // DWORD biSize -- The number of bytes required by the structure
        40, 0, 0, 0,
        // LONG biWidth -- The width of the bitmap, in pixels
        biWidth & 0xff, biWidth >> 8 & 0xff, biWidth >> 16 & 0xff, biWidth >> 24 & 0xff,
        // LONG biHeight -- The height of the bitmap, in pixels
        biHeight & 0xff, biHeight >> 8  & 0xff, biHeight >> 16 & 0xff, biHeight >> 24 & 0xff,
        // WORD biPlanes -- The number of planes for the target device. This value must be set to 1
        1, 0,
        // WORD biBitCount -- The number of bits-per-pixel, 24 bits-per-pixel -- the bitmap
        // has a maximum of 2^24 colors (16777216, Truecolor)
        24, 0,
        // DWORD biCompression -- The type of compression, BI_RGB (code 0) -- uncompressed
        0, 0, 0, 0,
        // DWORD biSizeImage -- The size, in bytes, of the image. This may be set to zero for BI_RGB bitmaps
        biSizeImage & 0xff, biSizeImage >> 8 & 0xff, biSizeImage >> 16 & 0xff, biSizeImage >> 24 & 0xff,
        // LONG biXPelsPerMeter, unused
        0,0,0,0,
        // LONG biYPelsPerMeter, unused
        0,0,0,0,
        // DWORD biClrUsed, the number of color indexes of palette, unused
        0,0,0,0,
        // DWORD biClrImportant, unused
        0,0,0,0
    ];

    var iPadding = (4 - ((biWidth * 3) % 4)) % 4;

    var aImgData = oData.data;

    var strPixelData = '';
    var biWidth4 = biWidth<<2;
    var y = biHeight;
    var fromCharCode = String.fromCharCode;

    do {
        var iOffsetY = biWidth4*(y-1);
        var strPixelRow = '';
        for (var x = 0; x < biWidth; x++) {
            var iOffsetX = x<<2;
            strPixelRow += fromCharCode(aImgData[iOffsetY+iOffsetX+2]) +
                        fromCharCode(aImgData[iOffsetY+iOffsetX+1]) +
                        fromCharCode(aImgData[iOffsetY+iOffsetX]);
        }

        for (var c = 0; c < iPadding; c++) {
            strPixelRow += String.fromCharCode(0);
        }

        strPixelData += strPixelRow;
    } while (--y);

    /**
    * base64 转 ascii
    * @method encodeData
    * @param {Buffer} data
    **/
    function encodeData(data) {
        if (!window.btoa) { throw 'btoa undefined' }
        var str = '';
        if (typeof data == 'string') {
            str = data;
        } else {
            for (var i = 0; i < data.length; i ++) {
                str += String.fromCharCode(data[i]);
            }
        }

        return btoa(str);
    }

    var strEncoded = encodeData(BITMAPFILEHEADER.concat(BITMAPINFOHEADER)) + encodeData(strPixelData);

    return strEncoded;
}

/**
 * imageData 转单色位图格式
 * @method genMonochromeBMP
 * @param {Buffer} oData
 **/
export function genMonochromeBMP(oData) {
    //
    // BITMAPFILEHEADER: http://msdn.microsoft.com/en-us/library/windows/desktop/dd183374(v=vs.85).aspx
    // BITMAPINFOHEADER: http://msdn.microsoft.com/en-us/library/dd183376.aspx
    //

    var biWidth     = oData.width;
    var biHeight    = oData.height;
    var biSizeImage = Math.ceil(biWidth * biHeight / 8);
    var bfSize      = biSizeImage + 62; // 54 字节的头信息 + 8 字节的调色板

    //
    //  typedef struct tagBITMAPFILEHEADER {
    //  	WORD bfType;
    //  	DWORD bfSize;
    //  	WORD bfReserved1;
    //  	WORD bfReserved2;
    //  	DWORD bfOffBits;
    //  } BITMAPFILEHEADER;
    //
    var BITMAPFILEHEADER = [
        // WORD bfType -- The file type signature; must be "BM"
        0x42, 0x4D,
        // DWORD bfSize -- The size, in bytes, of the bitmap file
        bfSize & 0xff, bfSize >> 8 & 0xff, bfSize >> 16 & 0xff, bfSize >> 24 & 0xff,
        // WORD bfReserved1 -- Reserved; must be zero
        0, 0,
        // WORD bfReserved2 -- Reserved; must be zero
        0, 0,
        // DWORD bfOffBits -- The offset, in bytes, from the beginning of the BITMAPFILEHEADER structure to the bitmap bits.
        0x3E, 0, 0, 0
    ];

    //
    //  typedef struct tagBITMAPINFOHEADER {
    //  	DWORD biSize;
    //  	LONG  biWidth;
    //  	LONG  biHeight;
    //  	WORD  biPlanes;
    //  	WORD  biBitCount;
    //  	DWORD biCompression;
    //  	DWORD biSizeImage;
    //  	LONG  biXPelsPerMeter;
    //  	LONG  biYPelsPerMeter;
    //  	DWORD biClrUsed;
    //  	DWORD biClrImportant;
    //  } BITMAPINFOHEADER, *PBITMAPINFOHEADER;
    //
    var BITMAPINFOHEADER = [
        // DWORD biSize -- The number of bytes required by the structure
        40, 0, 0, 0,
        // LONG biWidth -- The width of the bitmap, in pixels
        biWidth & 0xff, biWidth >> 8 & 0xff, biWidth >> 16 & 0xff, biWidth >> 24 & 0xff,
        // LONG biHeight -- The height of the bitmap, in pixels
        biHeight & 0xff, biHeight >> 8  & 0xff, biHeight >> 16 & 0xff, biHeight >> 24 & 0xff,
        // WORD biPlanes -- The number of planes for the target device. This value must be set to 1
        1, 0,
        // WORD biBitCount -- The number of bits-per-pixel, 1 bits-per-pixel -- the bitmap
        // has a maximum of 2^1 colors
        1, 0,
        // DWORD biCompression -- The type of compression, BI_RGB (code 0) -- uncompressed
        0, 0, 0, 0,
        // DWORD biSizeImage -- The size, in bytes, of the image. This may be set to zero for BI_RGB bitmaps
        biSizeImage & 0xff, biSizeImage >> 8 & 0xff, biSizeImage >> 16 & 0xff, biSizeImage >> 24 & 0xff,
        // LONG biXPelsPerMeter, unused
        0,0,0,0,
        // LONG biYPelsPerMeter, unused
        0,0,0,0,
        // DWORD biClrUsed, the number of color indexes of palette, unused
        0,0,0,0,
        // DWORD biClrImportant, unused
        0,0,0,0
    ];

    // 单色位图调色板
    var BITMAPRGBQUAD = [
        0x00, 0x00, 0x00, 0x00,
        0xFF, 0xFF, 0xFF, 0x00
    ];

    var iPadding = (4 - (Math.ceil(biWidth / 8) % 4)) % 4;

    var aImgData = oData.data;

    var strPixelData = [];
    var biWidth4 = biWidth<<2;
    var y = biHeight;

    let bitIndex = 0,
        pixelCache = 0x00;

    /* 遍历 imageData 数据 */
    do {
        let iOffsetY = biWidth4 * (y - 1);
        let strPixelRow = [];
        // 遍历一行
        for (let x = 0; x < biWidth; x++) {
            let iOffsetX = x<<2;
            let pixel = aImgData[iOffsetY + iOffsetX] == 255 ? 0x01 : 0x00;
            pixelCache = pixelCache | (pixel<<(7 - bitIndex));
            bitIndex++;
            // 8位一个字节
            if(bitIndex == 8) {
                strPixelRow.push(pixelCache);
                bitIndex = 0;
                pixelCache = 0x00;
            }
        }

        // 添加剩余一个像素
        if(bitIndex > 0 && bitIndex < 8) {
            strPixelRow.push(pixelCache);
            bitIndex = 0;
            pixelCache = 0x00;
        }

        // 每一行字节数需要是 4 的倍数
        for (let c = 0; c < iPadding; c++) {
            strPixelRow.push(0);
        }

        strPixelData = strPixelData.concat(strPixelRow);
    } while (--y);

    /**
    * base64 转 ascii
    * @method encodeData
    * @param {Buffer} data
    **/
    function encodeData(data) {
        if (!window.btoa) { throw 'btoa undefined' }
        var str = '';
        for (var i = 0; i < data.length; i ++) {
            str += String.fromCharCode(data[i]);
        }

        return btoa(str);
    }

    var strEncoded = encodeData(BITMAPFILEHEADER.concat(BITMAPINFOHEADER).concat(BITMAPRGBQUAD).concat(strPixelData));
    return strEncoded;
}

/**
 * 画布缩放函数
 * @method scaleCanvas
 * @param {Object} canvas
 * @param {Integer} width
 * @param {Integer} height
 **/
export function scaleCanvas(canvas, width, height) {
    let w = canvas.width,
        h = canvas.height;

    if (width == undefined) {
        width = w;
    }
    if (height == undefined) {
        height = h;
    }

    let context = canvas.getContext('2d');
    context.scale(width / w, height /h);
    context.drawImage(canvas, 0, 0);

    let $canvas = document.createElement('canvas');
    $canvas.width = width;
    $canvas.height = height;
    let $context = $canvas.getContext('2d');
    $context.drawImage(canvas, 0, 0);

    return $canvas;
}

export default {
    genBitmapImage,
    scaleCanvas
}
