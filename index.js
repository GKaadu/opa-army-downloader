import axios from 'axios';
import fetch from 'node-fetch';
import fs from 'fs';
import path  from 'path';
import { fileURLToPath } from 'url';

// subfolder of current directory to store PDFs
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfFolder = path.join(__dirname, 'pdfs');

// Ensure the directory exists
if (!fs.existsSync(pdfFolder)) {
    fs.mkdirSync(pdfFolder, { recursive: true });
}

// Array of game systems. Contains short name, id and slug
const gameSystems = [
    { name: 'Grimdark Future', short_name: "GF", id: 2, slug: 'grimdark-future' },
    { name: 'Grimdark Future - Firefight', short_name: "GFF", id: 3, slug: 'grimdark-future-firefight' },
    { name: 'Age of Fantasy', short_name: "AOF", id: 4, slug: 'age-of-fantasy' },
    { name: 'Age of Fantasy - Skirmish', short_name: "AOFS", id: 5, slug: 'age-of-fantasy-skirmish' },
    { name: 'Age of Fantasy - Regiments', short_name: "AOFR", id: 5, slug: 'age-of-fantasy-regiments' }
]

// API to fetch army books
const apiURL = 'https://army-forge.onepagerules.com/api/army-books?filters=official&gameSystemSlug=[slug]&searchText=&page=1&unitCount=0&balanceValid=false&customRules=true&fans=false&sortBy=null';

// Function to download PDF
const downloadPDF = async (book, system) => {
    const systemFolder = path.join(pdfFolder, system.name);

    const flavouredUid = book.flavouredUid;
    const name = book.name;
    const versionString = book.versionString;

    const fileName = `${system.short_name} - ${name} ${versionString}.pdf`;

    // if the book exists in the system folder, skip download
    if (fs.existsSync(path.join(systemFolder, fileName))) {
        // console.log(`Already downloaded: ${fileName}`);
        return;
    }

    const pdfUrl = `https://army-forge-studio.onepagerules.com/api/army-books/${flavouredUid}/pdf`;
    const response = await fetch(pdfUrl);

    if (response.ok) {
        const fileStream = fs.createWriteStream(path.join(systemFolder, fileName));
        response.body.pipe(fileStream);
        console.log(`Downloaded: ${fileName}`);
    } else {
        console.error(`Failed to download PDF: ${fileName} - ${response.status}`);
        console.debug(`URL: ${pdfUrl}`);
        console.debug(`Response: ${JSON.stringify(response)}`);
    }
};

// Function to get the army books and download their PDFs
const fetchArmyBooks = async (url, system) => {
    try {
        const response = await axios.get(url);
        const armyBooks = response.data; // Array of objects

        // Loop through each object and extract the uid
        for (const book of armyBooks) {
            await downloadPDF(book, system); // Download each PDF
        }
    } catch (error) {
        console.error('Error fetching army books:', error);
    }
};

const getAllGameSystemBooks = async () => {
    for (const system of gameSystems) {
        const url = apiURL.replace('[slug]', system.slug);

        // create subfolder for game system
        const systemFolder = path.join(pdfFolder, system.name);
        if (!fs.existsSync(systemFolder)) {
            fs.mkdirSync(systemFolder, { recursive: true });
        }

        await fetchArmyBooks(url, system);
    }
}

// Start the process
getAllGameSystemBooks();