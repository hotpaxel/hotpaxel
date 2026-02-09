
import { parseArgs } from "util";
import fs from "fs";
import path from "path";

const PAXEL_URL = "http://localhost:8888/compile";

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error("Usage: bun build_paxel.ts <tex_file>");
        process.exit(1);
    }

    const texFilePath = args[0];
    if (!fs.existsSync(texFilePath)) {
        console.error(`Error: File not found: ${texFilePath}`);
        process.exit(1);
    }

    const texContent = fs.readFileSync(texFilePath, "utf-8");
    const assets: { name: string; content: string }[] = [];

    // Simple regex to find \includegraphics{filename} or \includegraphics[...]{filename}
    // Matches: \includegraphics[optional]{filename}
    const regex = /\\includegraphics(?:\[.*?\])?\{(.+?)\}/g;
    let match;

    while ((match = regex.exec(texContent)) !== null) {
        const assetName = match[1];
        // Resolve asset path relative to tex file
        const assetPath = path.resolve(path.dirname(texFilePath), assetName);

        // Check if file exists (try exact, then extensions if missing)
        let foundPath = "";
        if (fs.existsSync(assetPath)) {
            foundPath = assetPath;
        } else {
            // Try common extensions
            for (const ext of ['.png', '.jpg', '.jpeg', '.pdf']) {
                if (fs.existsSync(assetPath + ext)) {
                    foundPath = assetPath + ext;
                    break;
                }
            }
        }

        if (foundPath) {
            console.log(`Found asset: ${assetName} -> ${foundPath}`);
            const fileBuffer = fs.readFileSync(foundPath);
            const base64Content = fileBuffer.toString('base64');

            // Use the basename as the name in the sandbox
            assets.push({
                name: path.basename(foundPath),
                content: base64Content
            });
        } else {
            console.warn(`Warning: Asset not found locally: ${assetName}`);
        }
    }

    const payload = {
        tex: texContent,
        assets: assets
    };

    const assetNames = assets.map(a => a.name).join(", ");
    console.log(`Sending ${texFilePath} to ${PAXEL_URL} with assets: [${assetNames}]...`);

    try {
        const response = await fetch(PAXEL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`Error: Server responded with ${response.status} ${response.statusText}`);
            try {
                const errorJson = await response.json();
                console.error("Error Details:");
                console.error(JSON.stringify(errorJson, null, 2));
            } catch (e) {
                const errorText = await response.text();
                console.error(errorText);
            }
            process.exit(1);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const outputFilename = path.basename(texFilePath, path.extname(texFilePath)) + ".pdf";
        fs.writeFileSync(outputFilename, buffer);

        console.log(`Success! PDF saved to ${outputFilename}`);

    } catch (error) {
        console.error("Error connecting to Paxel service:", error);
        console.error("Make sure the service is running on port 8888");
        process.exit(1);
    }
}

main();
