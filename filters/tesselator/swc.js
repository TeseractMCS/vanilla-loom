import { transformFile } from "@swc/core";
import { sync } from "glob";
import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join, relative, dirname } from "path";

const manifest = JSON.parse(readFileSync("./BP/manifest.json"));

const package_name = manifest.header.name;
const version = typeof manifest.header.version == "string" ? manifest.header.version : manifest.header.version.join(".");

const initialMS = Date.now();
console.log(`Started building ${package_name}@${version}!`);

const files = sync("./data/**/*.{ts,js}");

Promise.all(
    files.map((file) =>
        transformFile(file, {
            jsc: {
                parser: {
                    syntax: "typescript",
                    tsx: false,
                    decorators: true,
                },
                transform: {
                    legacyDecorator: true,
                    decoratorMetadata: true,
                },
                target: "es2020",
            },
            sourceMaps: false,
            module: {
                type: "es6",
            },
        })
            .then((output) => {
                const outPath = join("BP/scripts", relative("data", file));
                const outDir = dirname(outPath);
                console.warn(outDir);
                mkdirSync(outDir, { recursive: true });
                writeFileSync(outPath.replace(/\.ts$/, ".js"), output.code);
                unlinkSync(outPath);
                if (output.map) {
                    writeFileSync(outPath.replace(/\.ts$/, ".js.map"), output.map);
                }
            })
    )
)
    .then(() => {
        console.log(`Bundling finished in ${Date.now() - initialMS} milliseconds!`);
    })
    .catch((error) => {
        console.error(error);
    });
