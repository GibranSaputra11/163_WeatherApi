const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/lokasi", async (req, res) => {
    const kota = req.query.kota || "jakarta";
    const apiKey = "3SXLV5OSEv0GUDPCJD1T";
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(kota)}.json?key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const feature = response.data.features[0];

        if (!feature) {
            return res.status(404).json({ message: "Lokasi tidak ditemukan" });
        }

        console.log("Raw Context from MapTiler:", feature.context); 

        const [longitude, latitude] = feature.geometry.coordinates;
        const context = feature.context || [];

        const negara = context.find(item => item.id.startsWith("country"))?.text || "-";

        const provinsi = context.find(item => item.id.startsWith("region") || item.id.startsWith("province"))?.text || "-";

        let kecamatan = context.find(item => 
            item.id.startsWith("locality") || 
            item.id.startsWith("subdistrict") || 
            item.id.startsWith("municipality") ||
            item.id.startsWith("place")
        )?.text;

        if (!kecamatan || kecamatan === feature.text) {
            const parts = feature.place_name ? feature.place_name.split(",") : [];
            kecamatan = parts.length > 2 ? parts[0].trim() : "-";
        }

        res.json({
            kota: feature.text || kota,
            negara: negara,
            provinsi: provinsi,
            kecamatan: kecamatan,
            longitude: longitude,
            latitude: latitude
        });

    } catch (error) {
        console.error("Error MapTiler API:", error.message);
        res.status(500).json({
            message: "Gagal mengambil data dari MapTiler"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});