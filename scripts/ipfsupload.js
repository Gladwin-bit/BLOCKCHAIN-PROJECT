import pinataSDK from "@pinata/sdk";
import fs from "fs";

const pinata = new pinataSDK({
 pinataApiKey: "c9add49eb7669b29ee02",
  pinataSecretApiKey: "311c5920f47ce01918a732d762f55e9e1a6431321c273e70434ef25e73668d2c"
});

async function uploadFile() {
  try {
    const readableStreamForFile = fs.createReadStream("./batchMetadata.json");

    // ✅ must include file metadata
    const options = {
      pinataMetadata: {
        name: "batchMetadata.json", // 👈 required
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };

    const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
    console.log("✅ Uploaded! CID:", result.IpfsHash);
  } catch (err) {
    console.error("❌ Error uploading:", err);
  }
}

uploadFile();
