import * as fs from "fs";
import * as path from "path";
import * as jimp from 'jimp';
import * as request from 'request-promise';
import * as https from 'https';

const RESOURCE_DIR = path.join(__dirname, '..', '..', 'resources');

function defaultMapper(x: number, y: number): string {
    return x + 'x' + y;
}

function slice(inputPath: string, outputPath: string, tileWidth: number, tileHeight: number, mapper: Function = defaultMapper): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(inputPath)) { reject('Invalid input path'); }
        if (!fs.existsSync(outputPath)) { fs.mkdirSync(outputPath); }

        jimp.read(inputPath).then(img => {
            const numTilesX = Math.floor(img.bitmap.width / tileWidth);
            const numTilesY = Math.floor(img.bitmap.height / tileHeight);

            let toWrite = 0;
            let written = 0;

            function onWritten() {
                written++;

                if (toWrite === written) {
                    resolve();
                }
            }

            for (let x = 0; x < numTilesX; x++) {
                for (let y = 0; y < numTilesY; y++) {
                    let clone = img.clone();

                    toWrite++;

                    if (numTilesX + numTilesY <= 2) {
                        clone.write(path.resolve(outputPath, mapper(x, y) + path.extname(inputPath)), onWritten);
                    } else {
                        clone.crop(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
                        clone.write(path.resolve(outputPath, mapper(x, y) + path.extname(inputPath)), onWritten);
                    }
                }
            }
        }).catch(err => {
            reject(err);
        });
    });
}

function download(url: string, path: string): Promise<void> {
	return new Promise((resolve, reject) => {
		let file = fs.createWriteStream(path);
        
		https.get(url, (res) => {
			res.pipe(file);

			file.on('finish', () => {
				file.close(); resolve();
            });
		}).on('error', err => {
            console.log(err);
        });
	});
}

export default function generate(resourceDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
        request('https://raw.githubusercontent.com/RobloxAPI/build-archive/master/data/production/latest.json').then(latest => {
            let sliceDir = path.join(resourceDir, 'classes');
            let filePath = path.join(resourceDir, 'classImages.png');

            let guid = JSON.parse(latest).GUID;
            
            download(`https://raw.githubusercontent.com/RobloxAPI/build-archive/master/data/production/builds/${guid}/ClassImages.png`, filePath).then(() => {
                slice(filePath, sliceDir, 16, 16, (x: number) => x.toString()).then(() => {
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        });
    });
}