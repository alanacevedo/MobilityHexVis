/**
 * Function injects specified HTML file to specified HTML 
 * node of the current file
 * 
 * @param filePath - a path to a source HTML file to inject
 * @param elem - an HTML element to which this content will 
 * be injected
 */
async function injectHTML(filePath, elem) {
    try {
        const response = await fetch("./html/" + filePath);
        if (!response.ok) {
            return;
        }
        const text = await response.text();
        elem.innerHTML = text;

        // Function to recursively process div elements with include attribute
        const processIncludes = async () => {
            const includes = elem.querySelectorAll("div[include]");
            for (const include of includes) {
                await injectHTML(include.getAttribute("include"), include);
            }
        };

        // Call the processIncludes function
        await processIncludes();

        // reinject all <script> tags
        elem.querySelectorAll("script").forEach(script => {
            const newScript = document.createElement("script");
            Array.from(script.attributes).forEach(attr =>
                newScript.setAttribute(attr.name, attr.value)
            );
            newScript.appendChild(
                document.createTextNode(script.innerHTML)
            );
            script.parentNode.replaceChild(newScript, script);
        });
    } catch (err) {
        console.error(err.message);
    }
}

/**
 * Function used to process all HTML tags of the following
 * format: <div include="<filename>"></div>
 * 
 * This function injects a content of <filename> to
 * each div with the "include" attribute
 */
function injectAllHTML() {
    document.querySelectorAll("div[include]")
        .forEach((elem) => {
            injectHTML(elem.getAttribute("include"), elem);
        })
}

export { injectAllHTML }