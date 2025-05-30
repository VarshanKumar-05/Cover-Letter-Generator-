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

           //The environment provides it at runtime.
            const apiKey = "AIzaSyDFbwzr9ZkaEghvVVju45krAdOjbQd3-og";

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
            // const apiKey = ""; // Duplicate declaration removed to avoid redeclaration error.

            // Listen for changes on style radio buttons to apply the selected style
            letterStyleRadios.forEach(radio => {
                radio.addEventListener('change', applyStyle);
            });

            // Apply the initial style when the page loads
            applyStyle();

            /**
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

                 let chatHistory = [];
                chatHistory.push({ role: "user", parts: [{ text: prompt }] });
                const payload = { contents: chatHistory };
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

                try {
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
             * Exports the generated cover letter as a single-page PDF.
             * Scales the content to fit within standard A4 dimensions.
             */
            exportPdfBtn.addEventListener('click', () => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size

                // Check if there's content to export
                if (coverLetterOutput.innerText.trim() === "Your generated cover letter will appear here." || coverLetterOutput.innerText.trim() === "") {
                    showMessageBox("There's no cover letter to export yet!");
                    return;
                }

                // Temporarily hide action buttons to prevent them from being captured in the PDF
                actionButtons.style.display = 'none';

                // Use html2canvas to render the coverLetterOutput div as a canvas image
                html2canvas(coverLetterOutput, {
                    scale: 2, // Increase scale for better resolution in PDF
                    useCORS: true, // Enable cross-origin image loading if any (though not expected here)
                    logging: false // Disable console logging from html2canvas
                }).then(canvas => {
                    // Re-show action buttons immediately after canvas generation
                    actionButtons.style.display = 'flex';

                    const imgData = canvas.toDataURL('image/png'); // Get image data from canvas

                    // A4 dimensions in mm (portrait)
                    const pdfWidth = doc.internal.pageSize.getWidth(); // 210 mm
                    const pdfHeight = doc.internal.pageSize.getHeight(); // 297 mm

                    // Calculate image dimensions to fit within PDF page, maintaining aspect ratio
                    const imgWidth = canvas.width;
                    const imgHeight = canvas.height;

                    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

                    const scaledWidth = imgWidth * ratio;
                    const scaledHeight = imgHeight * ratio;

                    // Calculate centered position with a small margin
                    const margin = 10; // mm
                    const x = (pdfWidth - scaledWidth) / 2;
                    const y = (pdfHeight - scaledHeight) / 2;


                    // Add the scaled image to the PDF
                    doc.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);

                    doc.save('cover_letter.pdf'); // Save the PDF
                    showMessageBox('Cover letter exported as PDF!'); // Show success message
                }).catch(error => {
                    // Handle errors during PDF generation
                    console.error('Error generating PDF:', error);
                    showMessageBox('Failed to export PDF. Please try again.');
                }).finally(() => {
                    // Ensure action buttons are always re-shown, even if an error occurs
                    actionButtons.style.display = 'flex';
                });
            });
        });