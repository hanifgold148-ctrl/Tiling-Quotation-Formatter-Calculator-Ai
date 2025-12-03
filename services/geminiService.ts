
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Settings, QuotationData } from '../types';

// Lazy initialization of the AI client
let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
    if (aiInstance) {
        return aiInstance;
    }
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        // This error will now be thrown when an AI feature is used, not on app load.
        throw new Error("Google Gemini API Key is missing. Please ensure it is configured correctly.");
    }
    aiInstance = new GoogleGenAI({ apiKey: API_KEY });
    return aiInstance;
}


// Helper function to convert File to a GoogleGenerativeAI.Part
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // The result includes the data URL prefix (e.g., "data:image/jpeg;base64,"), remove it.
        resolve(reader.result.split(',')[1]);
      } else {
        resolve(''); // Should not happen with readAsDataURL
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export const getTextFromImageAI = async (imageFile: File): Promise<string> => {
    try {
        const ai = getAiClient();
        const imagePart = await fileToGenerativePart(imageFile);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [
                imagePart,
                { text: "Extract all text from this image of handwritten or printed notes for a tiling job. Present the text clearly." }
            ]},
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini Vision API:", error);
        throw new Error("Failed to extract text from the image.");
    }
};

export const generateQuotationFromAI = async (inputText: string, settings: Settings, addCheckmateDefault: boolean, showChecklistDefault: boolean): Promise<any> => {
    const {
        wallTilePrice,
        floorTilePrice,
        sittingRoomTilePrice,
        externalWallTilePrice,
        stepTilePrice,
        // Granular prices
        bedroomTilePrice,
        toiletWallTilePrice,
        toiletFloorTilePrice,
        kitchenWallTilePrice,
        kitchenFloorTilePrice,
        
        cementPrice,
        whiteCementPrice,
        sharpSandPrice,
        workmanshipRate,
        // wastageFactor, // Not used in prompt calculation anymore per user request
        wallTileM2PerCarton,
        floorTileM2PerCarton,
        sittingRoomTileM2PerCarton,
        roomTileM2PerCarton,
        externalWallTileM2PerCarton,
        stepTileM2PerCarton,
        toiletWallTileM2PerCarton,
        toiletFloorTileM2PerCarton,
        kitchenWallTileM2PerCarton,
        kitchenFloorTileM2PerCarton,
        
        // Default Tile Sizes
        defaultToiletWallSize,
        defaultToiletFloorSize,
        defaultRoomFloorSize,
        defaultSittingRoomSize,
        defaultKitchenWallSize,
        defaultKitchenFloorSize,

        customMaterialUnits,
        defaultTermsAndConditions,
        defaultDepositPercentage,
        tilePricesBySize, // New setting
    } = settings;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            clientDetails: {
                type: Type.OBJECT,
                properties: {
                    clientName: { type: Type.STRING, description: 'The name of the client. Default to empty string if not found.' },
                    clientAddress: { type: Type.STRING, description: 'The address of the client or project. Default to empty string if not found.' },
                    clientPhone: { type: Type.STRING, description: 'The phone number of the client. Default to empty string if not found.' },
                    projectName: { type: Type.STRING, description: 'A name for the project, e.g., "Lekki Residence". Default to empty string if not found.' },
                },
                required: ['clientName', 'clientAddress', 'clientPhone', 'projectName']
            },
            tiles: {
                type: Type.ARRAY,
                description: 'List of all tile categories found in the text.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING, description: 'The name of the area, e.g., "Toilet Wall".' },
                        group: { type: Type.STRING, description: 'The section or unit this belongs to, e.g., "Flat 1", "Flat 2", "BQ", "General".' },
                        cartons: { type: Type.NUMBER, description: 'Number of cartons. If not present, estimate from m².' },
                        sqm: { type: Type.NUMBER, description: 'Square meters. If not present, estimate from cartons.' },
                        size: { type: Type.STRING, description: 'The size of the tile, e.g., "60x60", "40x40", "30x60". Default to empty string if not specified.' },
                        tileType: { type: Type.STRING, description: 'Categorize as "Wall", "Floor", "External Wall", "Step", or "Unknown".', enum: ['Wall', 'Floor', 'External Wall', 'Step', 'Unknown'] },
                        unitPrice: { type: Type.NUMBER, description: 'Price per carton. Use defaults if not specified.' },
                    },
                    required: ['category', 'group', 'cartons', 'sqm', 'size', 'tileType', 'unitPrice']
                }
            },
            materials: {
                type: Type.ARRAY,
                description: 'List of all other materials.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        item: { type: Type.STRING, description: 'Name of the material, e.g., "Cement".' },
                        quantity: { type: Type.NUMBER, description: 'Quantity of the material.' },
                        unit: { type: Type.STRING, description: 'Unit of measurement, e.g., "bags", "kg".' },
                        unitPrice: { type: Type.NUMBER, description: 'Price per unit. If not provided, estimate a reasonable price in NGN.' },
                    },
                    required: ['item', 'quantity', 'unit', 'unitPrice']
                }
            },
            adjustments: {
                type: Type.ARRAY,
                description: 'List of all discounts or additional charges.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING, description: 'Name of the adjustment, e.g., "Early Payment Discount" or "Extra Wall Prep".' },
                        amount: { type: Type.NUMBER, description: 'The value of the adjustment. Use a negative number for discounts and a positive number for extra charges.' },
                    },
                    required: ['description', 'amount']
                }
            },
            checklist: {
                type: Type.ARRAY,
                description: 'A checklist of key tasks for the project based on the job description. If checklists are disabled, return an empty array.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        item: { type: Type.STRING, description: 'A single task or milestone for the project.' },
                        checked: { type: Type.BOOLEAN, description: 'The status of the checklist item. MUST be `false`.' }
                    },
                    required: ['item', 'checked']
                }
            },
            workmanshipRate: { type: Type.NUMBER, description: `Rate for workmanship per m². Default to ${workmanshipRate} if not found.` },
            maintenance: { type: Type.NUMBER, description: `Maintenance fee. If not explicitly mentioned in the input, this value must be 0.` },
            profitPercentage: { type: Type.NUMBER, description: 'Profit percentage if mentioned, otherwise null.' },
            depositPercentage: { type: Type.NUMBER, description: `Deposit percentage required. If a percentage is mentioned (e.g., "50% advance", "60% upfront"), use that number. Otherwise, default to ${defaultDepositPercentage}. If no deposit is mentioned or implied, return null.` },
            termsAndConditions: { type: Type.STRING, description: `Terms and conditions for the quotation. If not found in user input, default to: "${defaultTermsAndConditions}"` }
        },
        required: ['clientDetails', 'tiles', 'materials', 'checklist', 'adjustments', 'workmanshipRate', 'maintenance', 'termsAndConditions']
    };
    
    // Format the size rules for the prompt
    const sizePriceRules = tilePricesBySize && tilePricesBySize.length > 0 
        ? tilePricesBySize.map(r => `*   Size "**${r.size}**" -> Use Price: **${r.price}** NGN`).join('\n                    ')
        : 'No specific size defaults configured.';

    const prompt = `
        You are "Tiling Quotation Formatter & Calculator AI" for professional tilers in Nigeria.
        Your task is to convert the following rough text input into a complete, clean, professional tiling quotation in JSON format.
        
        **CRITICAL INSTRUCTIONS (MUST ALWAYS EXECUTE FULLY):**

        1.  **Input Analysis:** Analyze the following text. It could be typed or from OCR, so it may contain errors.
            \`\`\`
            ${inputText}
            \`\`\`

        2.  **Structure & Grouping Analysis:**
            *   Look for Headers that indicate different units, apartments, or sections (e.g., "Flat 1", "Flat 2", "Boy's Quarters", "Main Building", "Duplex A").
            *   If you find these headers, assign the items listed under them to that specific **group**.
            *   If no specific headers are found, assign the group as "General".
            *   Example Input: "Flat 1: Kitchen 20m2... Flat 2: Kitchen 20m2..." -> Output: Item 1 group="Flat 1", Item 2 group="Flat 2".

        3.  **Abbreviation Expansion:** Before extracting other fields, you MUST first expand common tiling abbreviations found in the input. The expansion must be case-insensitive (e.g., 'tw', 'Tw', 'TW' all become 'Toilet Wall'). Use the full expanded name as the category. You MUST recognize and expand the following:
            *   **TW**: Toilet Wall
            *   **TF**: Toilet Floor
            *   **KW**: Kitchen Wall
            *   **KF**: Kitchen Floor
            *   **SR**: Sitting Room
            *   **LR**: Living Room
            *   **BR**: Bedroom
            *   **MBR**: Master Bedroom
            *   **DR** or **DIN**: Dining Room
            *   **LOB** or **PASS**: Lobby or Passage
            *   **STR**: Store
            *   **EXT**: External Wall or Outside Wall
            *   **STEP**: Step or Staircase

        4.  **Field Extraction & Defaults:** Extract all relevant fields from the (now expanded) text. If a field is missing or seems incorrect, apply the specified defaults. NEVER fail or stop. ALWAYS produce a full JSON output.
            *   **Client & Project Details:** Look for information like client name, address, phone number, or a project name in the text. If any are not found, their value MUST be an empty string "".
            *   **Tile Sizes (CRITICAL):** 
                1.  If the user explicitly states a size in the text (e.g., "60x60", "30 by 60"), you MUST use that size.
                2.  **If NO size is found**, you **MUST** apply the following DEFAULT SIZES based on the category:
                    *   Toilet Wall: "${defaultToiletWallSize}"
                    *   Toilet Floor: "${defaultToiletFloorSize}"
                    *   Kitchen Wall: "${defaultKitchenWallSize}"
                    *   Kitchen Floor: "${defaultKitchenFloorSize}"
                    *   Bedroom / Room: "${defaultRoomFloorSize}"
                    *   Sitting Room / Living Room: "${defaultSittingRoomSize}"
                    *   Any other floor: "${defaultRoomFloorSize}"
                    *   Any other wall: "${defaultToiletWallSize}"
                *   Normalize the format to "WidthxHeight" (e.g. "25x40").

            *   **Tile Categories:** Identify categories using their full names after abbreviation expansion.
            *   **Quantities & Calculation Logic (CRITICAL):** This is the most important part. You MUST follow these rules strictly, in this order of precedence:
                1.  **If 'm²' (square meters) is provided:** This value is the absolute source of truth for the area. You MUST use it to calculate the number of 'cartons'. Any carton number provided in the input for the same line item MUST BE IGNORED AND OVERWRITTEN. Use the exact formula: \`cartons = (m² / [appropriate m²/carton rate])\`. The result MUST be rounded up to the next whole number (e.g., 40.1 becomes 41). Do NOT add any extra wastage factor.
                2.  **If ONLY 'cartons' is provided (and 'm²' is NOT):** You MUST calculate the 'm²'. Use the exact formula: \`m² = cartons * [appropriate m²/carton rate]\`.
                3.  **If NEITHER 'm²' nor 'cartons' are provided for a category:** You MUST set both 'cartons' and 'm²' to 0 for that category. Do not invent or assume quantities.
            *   **Coverage Rates for Calculation:** Use these exact rates when you need to calculate 'cartons' from 'm²'.
                *   **Sitting Room:** If category contains 'Sitting Room', 'Living Room', 'Parlour', or 'Dining', you MUST use: ${sittingRoomTileM2PerCarton} m²/carton.
                *   **Room:** If category contains 'Room', 'Bedroom', 'Master Bedroom', 'Guest Room', or 'Store', you MUST use: ${roomTileM2PerCarton} m²/carton.
                *   **Toilet Wall:** If category contains 'Toilet Wall' or 'Bathroom Wall', you MUST use: ${toiletWallTileM2PerCarton} m²/carton.
                *   **Toilet Floor:** If category contains 'Toilet Floor' or 'Bathroom Floor', you MUST use: ${toiletFloorTileM2PerCarton} m²/carton.
                *   **Kitchen Wall:** If category contains 'Kitchen Wall', you MUST use: ${kitchenWallTileM2PerCarton} m²/carton.
                *   **Kitchen Floor:** If category contains 'Kitchen Floor', you MUST use: ${kitchenFloorTileM2PerCarton} m²/carton.
                *   **Wall Tiles:** For any other wall category, you MUST use: ${wallTileM2PerCarton} m²/carton.
                *   **General Floor:** For any other floor types, you MUST use: ${floorTileM2PerCarton} m²/carton.
                *   **External Wall:** For 'External Wall' categories, you MUST use: ${externalWallTileM2PerCarton} m²/carton.
                *   **Step:** For 'Step' or 'Staircase' categories, you MUST use: ${stepTileM2PerCarton} m²/carton.
            *   **Tile Type & Unit Price Defaults (NGN):** 
                Determine the 'unitPrice' based on this **STRICT PRIORITY ORDER**:
                
                1.  **User Override:** If the user explicitly states a price for a line item in the text (e.g., "@ 7000", "rate 5500"), that price ALWAYS takes precedence.
                2.  **Size-Based Defaults:** Check if the extracted 'size' (or the default size applied above) matches any of the configured size rules below. Match flexibly (e.g., "60 by 60" matches "60x60").
                    ${sizePriceRules}
                    If a match is found, use that price.
                3.  **Category-Based Defaults:** If no size match is found, use the category name:
                    *   **Sitting Room:** If category contains 'Sitting Room', 'Living Room', 'Dining', or 'Parlour' -> Price: ${sittingRoomTilePrice} (Type: Floor).
                    *   **Bedroom/Room:** If category contains 'Bedroom', 'Room', 'Guest Room', 'Master' -> Price: ${bedroomTilePrice} (Type: Floor).
                    *   **Toilet Wall:** If category contains 'Toilet Wall', 'Bathroom Wall', 'Restroom Wall' -> Price: ${toiletWallTilePrice} (Type: Wall).
                    *   **Toilet Floor:** If category contains 'Toilet Floor', 'Bathroom Floor', 'Restroom Floor' -> Price: ${toiletFloorTilePrice} (Type: Floor).
                    *   **Kitchen Wall:** If category contains 'Kitchen Wall' -> Price: ${kitchenWallTilePrice} (Type: Wall).
                    *   **Kitchen Floor:** If category contains 'Kitchen Floor' -> Price: ${kitchenFloorTilePrice} (Type: Floor).
                    *   **External Wall:** If category contains 'External Wall', 'Outside Wall', or 'Facade' -> Price: ${externalWallTilePrice} (Type: External Wall).
                    *   **Step:** If category contains 'Step' or 'Staircase' -> Price: ${stepTilePrice} (Type: Step).
                    *   **General Wall:** If category contains 'Wall' -> Price: ${wallTilePrice} (Type: Wall).
                    *   **General Floor:** If category contains 'Floor' -> Price: ${floorTilePrice} (Type: Floor).
                    *   **Unknown:** If no keywords match -> Price: ${floorTilePrice} (Type: Unknown).

            *   **Materials:** Extract materials like 'Cement', 'White Cement', 'Sand'. If unit prices are missing, you MUST use these specific default prices (in NGN):
                *   Cement (per bag): ${cementPrice}
                *   White Cement (per bag): ${whiteCementPrice}
                *   Sharp Sand: ${sharpSandPrice}
                *   For any other materials not listed above, use reasonable market estimates in NGN.
                *   **Recognized Units:** When determining the 'unit' for a material, prioritize from this list: [${customMaterialUnits.join(', ')}]. If the unit is not in this list but is mentioned, use the mentioned unit.
            *   **Rates & Adjustments:**
                *   Workmanship rate per m²: Default is ${workmanshipRate}.
                *   Maintenance fee: Extract this if explicitly mentioned. **If not mentioned, set it to 0.**
                *   **Discounts/Charges:** Look for line items like "discount", "special offer", or "extra charge". Populate the 'adjustments' array. For discounts, the amount MUST be a negative number. For extra charges, it must be a positive number. If none are found, return an empty array [].
            *   **Profit & Deposit:**
                *   Profit: Extract profit only if explicitly mentioned as a percentage. Otherwise, the field should be null.
                *   Deposit: If the text mentions a deposit (e.g., "50% advance", "60% upfront"), extract the percentage number and set it as \`depositPercentage\`. If nothing is mentioned, default to ${defaultDepositPercentage}.
            *   **Terms & Conditions**: If the user provides terms, use them. Otherwise, default to: "${defaultTermsAndConditions}"
        
        5.  **Generate a Checklist:**
            ${showChecklistDefault
                ? `*   Based on the job description, create a simple checklist of 3-5 key tasks or stages for the project (e.g., 'Surface Preparation', 'Tiling', 'Grouting', 'Cleanup').
                    *   The 'checked' status for all items MUST be 'false' initially. If the job description is too vague to create a list, provide a generic one.
                    ${addCheckmateDefault ? `*   You MUST add a final item to the checklist with the exact text "Checkmate".` : ''}`
                : `*   The user has disabled checklists. You MUST return an empty array [] for the 'checklist' property in the JSON.`
            }
            
        6.  **JSON Output:** Return ONLY a single valid JSON object that strictly adheres to the provided schema. Do not add any explanatory text before or after the JSON.
    `;
    
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);
        
        // Inject new visibility defaults based on settings
        return {
            ...parsedData,
            showBankDetails: true, // Default enabled, can be toggled
            showTerms: settings.showTermsAndConditions,
            showWorkmanship: true,
            showMaintenance: settings.showMaintenance,
            showTax: settings.showTax,
            showCostSummary: true,
        };

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to parse quotation data from AI response.");
    }
};

export const getAiSummaryForTts = async (quotation: QuotationData, grandTotal: number): Promise<string> => {
    const prompt = `
        You are a helpful assistant for a professional tiler.
        Your task is to create a brief, conversational, and natural-sounding summary of the following quotation JSON data.
        The summary is intended to be read aloud via text-to-speech. Make it sound like a person giving a quick, friendly overview.

        **Quotation Data:**
        \`\`\`json
        ${JSON.stringify({ client: quotation.clientDetails, tiles: quotation.tiles, materials: quotation.materials }, null, 2)}
        \`\`\`

        **Key Information:**
        *   The final grand total for this project is ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN'}).format(grandTotal)}.

        **Instructions:**
        1.  Start by addressing the project or client. e.g., "Alright, here is the summary for the ${quotation.clientDetails.projectName || quotation.clientDetails.clientName} quote."
        2.  Briefly mention the main areas being tiled or the total number of tile types. If there are different groups (like Flat 1, Flat 2), mention that.
        3.  Briefly mention one or two key materials if they stand out (e.g., a large quantity of cement).
        4.  Clearly state the final "Grand Total". You must use the value provided above. Spell out the currency for a more natural sound, for example, "one million, two hundred thousand Naira".
        5.  Keep the entire summary concise and friendly, ideally under 45 seconds when spoken.
        6.  Return ONLY the summary text, ready to be converted to speech. Do not add any extra formatting, explanations, or markdown.

        **Example Output (DO NOT COPY, JUST FOR STYLE):**
        "Okay, I have prepared the quote for the Lekki Residence project for Mr. John. It covers Flat 1 and Flat 2, totaling about 110 square meters. We have factored in the cement and tiles. The grand total for the project comes to one million, two hundred thirty-four thousand, five hundred sixty-seven Naira."
    `;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini for TTS summary:", error);
        throw new Error("Failed to generate audio summary.");
    }
};

export const generateSpeechFromText = async (text: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say this in a clear, professional tone: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {voiceName: 'Kore' }, // A standard, clear voice
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error calling Gemini TTS API:", error);
        throw new Error("Failed to generate speech from text.");
    }
};
