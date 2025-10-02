export function generateBookData() {
    const titles = [
        "The Silent Observer",
        "Midnight Chronicles",
        "The Last Symphony",
        "Desert Winds",
        "City of Shadows",
        "The Golden Key",
        "River's End",
        "Mountain Peak",
        "Ocean's Call",
        "Forest Whispers",
    ];

    const authors = [
        "Alexander Smith",
        "Emma Johnson",
        "Michael Brown",
        "Sarah Wilson",
        "David Lee",
        "Lisa Chen",
        "Robert Taylor",
        "Jessica Davis",
        "Christopher White",
        "Amanda Garcia",
    ];

    const genres = [
        "Fiction",
        "Mystery",
        "Romance",
        "Thriller",
        "Science Fiction",
        "Fantasy",
        "Biography",
        "History",
        "Adventure",
        "Drama",
    ];

    const descriptions = [
        "A captivating tale that explores the depths of human nature",
        "An epic adventure that spans across continents and cultures",
        "A thought-provoking story about love, loss, and redemption",
        "A gripping narrative that keeps you on the edge of your seat",
        "An inspiring journey of self-discovery and personal growth",
    ];

    return {
        title: titles[Math.floor(Math.random() * titles.length)],
        author: authors[Math.floor(Math.random() * authors.length)],
        isbn: `978-${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 10)}`,
        price: parseFloat((Math.random() * 40 + 10).toFixed(2)),
        genre: genres[Math.floor(Math.random() * genres.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        stockQuantity: Math.floor(Math.random() * 100) + 1,
        publishedDate: new Date(
            2000 + Math.floor(Math.random() * 24),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
        ).toISOString(),
    };
}

export function generateAuthorData() {
    const names = [
        "Alexander Smith",
        "Emma Johnson",
        "Michael Brown",
        "Sarah Wilson",
        "David Lee",
        "Lisa Chen",
        "Robert Taylor",
        "Jessica Davis",
        "Christopher White",
        "Amanda Garcia",
        "John Martinez",
        "Maria Rodriguez",
    ];

    const nationalities = [
        "American",
        "British",
        "Canadian",
        "Australian",
        "French",
        "German",
        "Italian",
        "Spanish",
        "Japanese",
        "Chinese",
    ];

    const bios = [
        "An acclaimed author known for thought-provoking narratives",
        "A bestselling writer with a passion for storytelling",
        "An award-winning novelist celebrated for complex characters",
        "A prolific author whose works span multiple genres",
        "A contemporary writer exploring modern themes",
    ];

    return {
        name: names[Math.floor(Math.random() * names.length)],
        bio: bios[Math.floor(Math.random() * bios.length)],
        nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
        birthDate: new Date(
            1940 + Math.floor(Math.random() * 60),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
        ).toISOString(),
        website: `https://www.author-${Math.floor(Math.random() * 1000)}.com`,
    };
}

export function generateUserProfile(vuId) {
    const userTypes = ["reader", "librarian", "manager"];
    const usagePatterns = ["heavy", "light", "burst"];

    // Distribute user types based on VU ID for consistency
    const userTypeIndex = (vuId - 1) % userTypes.length;
    const usagePatternIndex = Math.floor((vuId - 1) / userTypes.length) % usagePatterns.length;

    return {
        id: `user-${vuId}`,
        type: userTypes[userTypeIndex],
        usagePattern: usagePatterns[usagePatternIndex],
    };
}
