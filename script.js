 document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const jobRoleInput = document.getElementById('jobRole');
    const experienceInput = document.getElementById('experience');
    const skillsInput = document.getElementById('skills');
    const valuesInput = document.getElementById('values');
    const companyNameInput = document.getElementById('companyName');
    const interestInput = document.getElementById('interest');
    const generateBtn = document.getElementById('generateBtn');
    const generateBtnText = document.getElementById('generateBtnText');
    const loader = document.getElementById('loader');
    const coverLetterOutput = document.getElementById('coverLetterOutput');
    const copyToClipboardBtn = document.getElementById('copyToClipboardBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    const messageBoxClose = document.getElementById('messageBoxClose');
    const letterStyleRadios = document.querySelectorAll('input[name="letterStyle"]');
    const toneSelect = document.getElementById('tone');
    const actionButtons = document.getElementById('actionButtons'); // Reference to the action buttons container

    // API key for Gemini API - IMPORTANT: If running locally, replace with your actual key.
    // In the Canvas environment, this should remain empty as the environment provides it at runtime.
    const apiKey = "AIzaSyDFbwzr9ZkaEghvVVju45krAdOjbQd3-og"; // Replace with your actual API key if running outside Canvas

    /**
     * Displays a custom message box instead of native alert/confirm.
     * @param {string} message - The message to display.
     */
    function showMessageBox(message) {
        messageText.textContent = message;
        messageBox.classList.remove('hidden');
    }

    // Event listener to close the custom message box
    messageBoxClose.addEventListener('click', () => {
        messageBox.classList.add('hidden');
    });

    /**
     * Applies the selected style (Traditional or Modern) to the cover letter output area.
     */
    function applyStyle() {
        const selectedStyle = document.querySelector('input[name="letterStyle"]:checked').value;
        // Remove existing style classes and add the new one
        coverLetterOutput.classList.remove('traditional-style', 'modern-style');
        coverLetterOutput.classList.add(`${selectedStyle}-style`);
    }

    // Listen for changes on style radio buttons to apply the selected style
    letterStyleRadios.forEach(radio => {
        radio.addEventListener('change', applyStyle);
    });

    // Apply the initial style when the page loads
    applyStyle();

    /**
     * Generates the cover letter content using the Gemini API.
     * Handles input validation, loading states, API call, and displaying the result.
     */
    generateBtn.addEventListener('click', async () => {
        // Get trimmed values from input fields
        const jobRole = jobRoleInput.value.trim();
        const experience = experienceInput.value.trim();
        const skills = skillsInput.value.trim();
        const values = valuesInput.value.trim();
        const companyName = companyNameInput.value.trim();
        const interest = interestInput.value.trim();
        const selectedStyle = document.querySelector('input[name="letterStyle"]:checked').value;
        const selectedTone = toneSelect.value;

        // Basic input validation
        if (!jobRole || !companyName || !interest) {
            showMessageBox('Please fill in Job Role, Company Name, and Why You\'re Interested.');
            return; // Stop execution if required fields are empty
        }

        // Show loading indicator and disable the button during generation
        generateBtnText.textContent = 'Generating...';
        loader.classList.remove('hidden');
        generateBtn.disabled = true;

        // Construct the prompt for the Gemini API
        const prompt = `
            Generate a cover letter for a job application.
            Job Role: ${jobRole}
            Experience: ${experience ? `Years of Experience: ${experience}` : ''}
            Core Skills/Technologies: ${skills ? `Skills: ${skills}` : ''}
            Personal Values/Strengths: ${values ? `Values/Strengths: ${values}` : ''}
            Company Name: ${companyName}
            Why Interested: ${interest}
            Style: ${selectedStyle}
            Tone: ${selectedTone}

            Please provide a complete cover letter, structured professionally.
            Ensure the output is plain text, without markdown headings, but use paragraph breaks for readability.
        `;

        // Log the prompt for debugging purposes
        console.log('Prompt sent to Gemini API:', prompt);

        // Prepare the payload for the Gemini API call
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            // Make the API call to Gemini
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // If response is not OK (e.g., 4xx or 5xx status), throw an error
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
            }

            const result = await response.json(); // Parse the JSON response
            console.log('Full API response:', result); // Log the full API response for debugging

            // Check if the API response contains generated content
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;

                // Format the text for HTML display:
                // 1. Replace markdown bold with HTML strong tags
                let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // 2. Replace double newlines with paragraph tags, and single newlines with <br> for line breaks
                formattedText = formattedText.split('\n\n').map(para => `<p>${para.split('\n').join('<br>')}</p>`).join('');

                coverLetterOutput.innerHTML = formattedText; // Display the formatted letter
            } else {
                // Handle cases where the API response structure is unexpected or content is missing
                showMessageBox('Failed to generate cover letter. The API response was empty or malformed. Please try again.');
                console.error('Unexpected API response structure or empty content:', result);
            }
        } catch (error) {
            // Catch and display any network or API errors
            showMessageBox('An error occurred while generating the cover letter. Please check your network connection or try again later. See console for details.');
            console.error('Error calling Gemini API:', error);
        } finally {
            // Always hide loading indicator and re-enable the button
            generateBtnText.textContent = 'Generate Cover Letter';
            loader.classList.add('hidden');
            generateBtn.disabled = false;
        }
    });

    /**
     * Copies the text content of the generated cover letter to the clipboard.
     * Uses a temporary textarea for cross-browser compatibility in iframes.
     */
    copyToClipboardBtn.addEventListener('click', () => {
        const textToCopy = coverLetterOutput.innerText; // Get plain text content

        // Prevent copying if the output area is empty or contains placeholder text
        if (textToCopy.trim() === "Your generated cover letter will appear here." || textToCopy.trim() === "") {
            showMessageBox("There's no cover letter to copy yet!");
            return;
        }

        // Create a temporary textarea element to hold the text
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed'; // Prevent scrolling to bottom
        textarea.style.opacity = '0'; // Make it invisible
        document.body.appendChild(textarea); // Append to body

        textarea.select(); // Select the text
        try {
            document.execCommand('copy'); // Execute the copy command
            showMessageBox('Cover letter copied to clipboard!');
        } catch (err) {
            // Fallback for browsers where execCommand might fail
            console.error('Failed to copy text: ', err);
            showMessageBox('Failed to copy. Please try manually selecting and copying the text.');
        } finally {
            document.body.removeChild(textarea); // Remove the temporary textarea
        }
    });

    /**
     * Exports the generated cover letter as a multi-page PDF with readable text.
     */
    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size

        // Check if there's content to export
        if (coverLetterOutput.innerText.trim() === "Your generated cover letter will appear here." || coverLetterOutput.innerText.trim() === "") {
            showMessageBox("There's no cover letter to export yet!");
            return;
        }

        // Get the raw text content from the output div
        const textContent = coverLetterOutput.innerText;

        // Define PDF page dimensions and margins
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20; // mm
        const usableWidth = pageWidth - 2 * margin;
        let yPos = margin; // Starting Y position

        // Set font for PDF (changed to Times-Roman for a more formal look)
        doc.setFont('Times-Roman');
        doc.setFontSize(12); // Increased font size for readability
        const lineHeight = 8; // Increased line height for better spacing

        // Split the content into lines/paragraphs, handling bold text
        const paragraphs = textContent.split('\n\n'); // Split by double newline for paragraphs

        paragraphs.forEach(para => {
            // Split each paragraph into lines that fit the page width
            const lines = doc.splitTextToSize(para, usableWidth);

            lines.forEach(line => {
                // Check if the current line exceeds page height, if so, add a new page
                if (yPos + lineHeight > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin; // Reset Y position for new page
                    doc.setFont('Times-Roman'); // Re-apply font after new page
                    doc.setFontSize(12); // Re-apply font size after new page
                }

                // Check for bold parts within the line and render them
                const boldRegex = /\*\*(.*?)\*\*/g; // Regex to find **bold** text
                let match;
                let lastIndex = 0;
                let currentX = margin;

                while ((match = boldRegex.exec(line)) !== null) {
                    // Add non-bold part
                    if (match.index > lastIndex) {
                        doc.setFont('Times-Roman', 'normal');
                        doc.text(line.substring(lastIndex, match.index), currentX, yPos);
                        currentX += doc.getStringUnitWidth(line.substring(lastIndex, match.index)) * doc.internal.getFontSize() / doc.internal.scaleFactor;
                    }

                    // Add bold part
                    doc.setFont('Times-Roman', 'bold');
                    doc.text(match[1], currentX, yPos);
                    currentX += doc.getStringUnitWidth(match[1]) * doc.internal.getFontSize() / doc.internal.scaleFactor;

                    lastIndex = boldRegex.lastIndex;
                }

                // Add remaining non-bold part of the line
                if (lastIndex < line.length) {
                    doc.setFont('Times-Roman', 'normal');
                    doc.text(line.substring(lastIndex), currentX, yPos);
                }

                yPos += lineHeight; // Move Y position down for the next line
            });

            // Add extra space between paragraphs
            yPos += lineHeight * 0.5; // Half a line height for paragraph spacing
        });

        doc.save('cover_letter.pdf'); // Save the PDF
        showMessageBox('Cover letter exported as PDF!'); // Show success message
    });
});
