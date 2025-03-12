const fs = require("fs")
const { createCanvas } = require("canvas")

// Create a 512x512 icon
const canvas512 = createCanvas(512, 512)
const ctx512 = canvas512.getContext("2d")

// Background
ctx512.fillStyle = "#000000"
ctx512.fillRect(0, 0, 512, 512)

// Text
ctx512.fillStyle = "#FFFFFF"
ctx512.font = "bold 200px Arial"
ctx512.textAlign = "center"
ctx512.textBaseline = "middle"
ctx512.fillText("L", 256, 256)

// Save the 512x512 icon
const buffer512 = canvas512.toBuffer("image/png")
fs.writeFileSync("./public/icon-512.png", buffer512)

// Create a 192x192 icon
const canvas192 = createCanvas(192, 192)
const ctx192 = canvas192.getContext("2d")

// Background
ctx192.fillStyle = "#000000"
ctx192.fillRect(0, 0, 192, 192)

// Text
ctx192.fillStyle = "#FFFFFF"
ctx192.font = "bold 75px Arial"
ctx192.textAlign = "center"
ctx192.textBaseline = "middle"
ctx192.fillText("L", 96, 96)

// Save the 192x192 icon
const buffer192 = canvas192.toBuffer("image/png")
fs.writeFileSync("./public/icon-192.png", buffer192)

console.log("Icons generated successfully!")

