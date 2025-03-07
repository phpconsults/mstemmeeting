(function () {
    /** Check if OneCloud Reimagine namespace exists */
    if (!window.ocReimagine) {
        window.ocReimagine = {};
    }

    /** Create product price module namespace */
    if (!window.ocReimagine.ProductPriceModule) {
        window.ocReimagine.ProductPriceModule = {};
    }

    /** Initializes the reimagine product pricing manager and services */
    function initializeProductPriceModule() {
        try {
            // Check if product pricing manager instance exists
            if (window.ocReimagine && window.ocReimagine.ProductPriceModule && window.ocReimagine.ProductPriceModule.PricingManagerInstance) {
                // If it exists, that means it has already been initialized so no need to re-initialize
                return;
            }

            window.ocReimagine.ProductPriceModule.PricingManagerInstance = new window.ocReimagine.ProductPriceModule.ProductPricingManager();
        }
        catch (error) {
        }
    }

    /**
     * By default the reimagine pricing-scripts are initialized on page load complete
     */
    (document).addEventListener("DOMContentLoaded", () => {
        initializeProductPriceModule();
    });

    /**
     * Initialize the reimagine pricing-scripts with market-selector init event
     * @summary since there is a race condition on page load event between market-selector's init event and pricing-module's init event,
     *          try to initialize the pricing scripts after the market-selector is initialized and dispatches the init event
     */
    (document).addEventListener("onInit", () => {
        initializeProductPriceModule();
    });
}());

/**
 * Constants for the product pricing configuration options and services.
 * @class {ProductPricingConstants} - configuration parameters for the product pricing module.
 */
window.ocReimagine.ProductPriceModule.ProductPricingConstants = class ProductPricingConstants {
    /**
     * Default values for the product pricing module.
     * @readonly
     */
    static Defaults = Object.freeze({
        Locale: "en-us"
    })

    /**
     * Cache policy for the product pricing module.
     * @readonly
     */
    static CachePolicy = Object.freeze({
        IsCachingEnabled: true,
        StorageLocation: "memory"
    })

    /**
     * Request settings for the product pricing module.
     * @readonly
     */
    static Request = Object.freeze({
        Method: "GET",
        RelativeUri: "/m365/product/price",
        Headers: Object.freeze({
            "Content-Type": "application/json"
        }),
        QueryParameters: Object.freeze({
            "v": "4",
            "r": "json"
        }),
        MaxQueryCount: 5
    })

    /**
     * Pricing component template names for the product pricing module.
     */
    static Templates = Object.freeze({
        Sku: "sku"
    });

    /**
     * HTML Selectors for the product pricing module.
     * @readonly
     */
    static Selectors = Object.freeze({
        Dataset: Object.freeze({
            Component: "[data-ocr-pricing-component]",
            RenderSection: "[data-ocr-pricing-section='render']",
            TemplateContent: "[data-ocr-pricing-content]",
            PricingConfig: "[data-ocr-pricing-config]",
            MarketSelector: "[data-mount='market-selector']",
        }),
    });

    /**
     * Enumerables for the product pricing module.
     * @readonly
     */
    static Enumerables = Object.freeze({
        Response: Object.freeze({
            Undefined: "Undefined",
            Success: "Success",
            NotFound: "NotFound",
            NoAvailableSku: "NoAvailableSku",
            DisabledMarket: "DisabledMarket"
        }),
        TitleType: Object.freeze({
            SKU: "SKU",
            PRODUCT: "PRODUCT",
            OVERRIDE: "OVERRIDE"
        })
    });

    /**
     * Parameters for the product pricing module.
     */
    static Parameters = Object.freeze({
        ScreenReader: Object.freeze({
            ListPriceKey: "%{listPrice}",
            MsrpKey: "%{msrpPrice}"
        }),
        MarketSelector: Object.freeze({
            Query: Object.freeze({
                Market: "market"
            }),
            RefreshMode: Object.freeze({
                AJAX: "ajax"
            })
        })
    });

    /**
     * Constants for custom event listener names
     * @readonly
     */
    static Events = Object.freeze({
        MarketSelector: Object.freeze({
            OnRefreshed: "onRefreshed",
            OnInit: "onInit"
        })
    })
}
//#region Reimagine Product Pricing Templates Class
/**
 * @class ProductPricingTemplates - Helper Class for getting product pricing component templates.
 */
window.ocReimagine.ProductPriceModule.ProductPricingTemplates = class ProductPricingTemplates {
    /**
     * Gets the constants for the product pricing module.
     */
    static pricingConstants = window.ocReimagine.ProductPriceModule.ProductPricingConstants;

    /**
     * Gets the template markup for the given template name.
     * @param {HTMLTemplateElement} pricingTemplateElement pricing component element 
     * @param {string} templateName template name
     * @param {PricingConfig} pricingConfig config object
     * @param {ProductPricingResponse} pricingResponse pricing response object.
     * @returns {DocumentFragment} The template markup for the given template name.
     */
    static getAvailableTemplate(pricingTemplateElement, templateName, pricingConfig, pricingResponse) {
        // Get the template markup for the given template name.
        let templateMarkup;

        switch (templateName) {
            case this.pricingConstants.Templates.Sku:
                templateMarkup = getSkuMarkup(pricingConfig, pricingResponse);
                break;
            default:
                templateMarkup = "";
        }

        return this.replaceConfigContent(templateMarkup, pricingTemplateElement);
    }

    /**
     * Replaces the config content from the pricing component element in the template markup.
     * @param {string} templateMarkup template markup.
     * @param {HTMLTemplateElement} pricingTemplateElement authored pricing template element.
     * @returns {DocumentFragment} The template markup for the given template name.
     */
    static replaceConfigContent(templateMarkup, pricingTemplateElement) {
        const authoredTemplateFragment = pricingTemplateElement.content.cloneNode(true);
        const templateFragment = document.createRange().createContextualFragment(templateMarkup);
        // Iterate over configured template fragment content elements.
        const templateContentElements = templateFragment.querySelectorAll(this.pricingConstants.Selectors.Dataset.TemplateContent);

        templateContentElements.forEach((templateContentElement) => {
            const attributeValue = templateContentElement.dataset.ocrPricingContent;
            const configElement = authoredTemplateFragment.querySelector(`[data-ocr-pricing-content="${attributeValue}"]`);

            // Remove the content from template if match does not exist in authored template.
            if (!configElement) {
                templateContentElement.remove();
                return;
            }

            // Replace the config content from the pricing component element in the template markup.
            templateContentElement.replaceWith(configElement);
        });

        return templateFragment;
    }

    /**
     * Gets unavailable pricing component markup.
     * @param {PricingConfig} pricingConfig config object.
     * @param {HTMLTemplateElement} pricingTemplateElement authored pricing component element
     * @returns HTML string for unavailable pricing component.
     */
    static getUnavailableTemplate(pricingConfig, pricingTemplateElement) {
        const markup = `
            <div class="sku">
                ${pricingConfig.renderTitle ?
                `<div class="sku__title" data-ocr-pricing-render="title">
                    <h3 class="oc-product-title">${pricingConfig.renderTitle}</h3>
                </div>` : ''}
                <div class="sku__paragraph" data-ocr-pricing-content="paragraph"></div>
                <div class="sku__unavailable not-found" data-ocr-pricing-content="unavailable"></div>
            </div>
        `;
        return this.replaceConfigContent(markup, pricingTemplateElement);
    }

    /**
     * Gets disabled pricing component markup.
     * @param {PricingConfig} pricingConfig config object.
     * @param {HTMLTemplateElement} pricingTemplateElement authored pricing component element
     * @returns HTML string for disabled pricing component.
     */
    static getDisabledMarketTemplate(pricingConfig, pricingTemplateElement) {
        const markup = `
            <div class="sku">
                ${pricingConfig.renderTitle ?
                `<div class="sku__title" data-ocr-pricing-render="title">
                    <h3 class="oc-product-title">${pricingConfig.renderTitle}</h3>
                </div>` : ''}
                <div class="sku__paragraph" data-ocr-pricing-content="paragraph"></div>
                <div class="sku__unavailable disabled-market" data-ocr-pricing-content="disabled"></div>
            </div>
        `;
        return this.replaceConfigContent(markup, pricingTemplateElement);
    }

    /*============================ Component Templates ============================*/
}
//#endregion Reimagine Product Pricing Template Class
/**
 * @class ProductPricingRequest - Helper Class for making product pricing requests.
 */
window.ocReimagine.ProductPriceModule.ProductPricingRequest = class ProductPricingRequest {
    /**
     * Gets the constants for the product pricing module.
     */
    pricingConstants = window.ocReimagine.ProductPriceModule.ProductPricingConstants;

    /**
     * Gets or sets the current locale for the page.
     * @type {string}
     */
    locale;

    /**
     * Gets or sets the country for the page.
     * @type {string}
     */
    country;

    /**
     * Gets or sets the market for the page.
     * @type {string | null}
     */
    #market;

    /**
     * Gets the current selected market for the page.
     */
    get market() {
        return this.#market;
    }

    /**
     * Sets the current selected market for the page.
     */
    set market(value) {
        this.#market = value;
    }


    /**
     * Gets or sets the flag to indicate if caching is enabled for product pricing requests.
     * @type {boolean}
     */
    isCachingEnabled;

    /**
     * Gets or sets the instances of rendered pricing component instances for the current page.
     * @type {ProductPricingRendering[]}
     */
    renderedInstances;

    /**
     * Gets or sets the query from each instance of rendered pricing component for the current page.
     * @type {Set<string>}
     */
    uniqueQuerySet;

    /**
     * Gets or sets the map of pricing component request and response for the current page.
     * @description
     * Key - request query string,
     * Value - product pricing response for the request query
     * @summary this map is used to cache in-memory the product pricing response for the current page and avoid duplicate requests for the same request query.
     * @type {Map<string, ProductPricingResponse[]>}
     */
    responseCacheMap;

    /**
     * Gets or sets the instances of XHR request controllers for each in-progress requests.
     * @type {Array<XMLHttpRequest>}
     */
    xhrRequestControllers;

    /**
     * Initializes instance of the product pricing request helper class.
     * @param {string} locale - The locale 'll-cc' of the page.
     * @param {string} country - Current country of the page.
     * @param {string | null} market - Current selected market of the page.
     */
    constructor(locale, country, market) {
        this.locale = locale;
        this.country = country;
        this.market = market;
        this.renderedInstances = [];
        this.uniqueQuerySet = new Set();
        this.responseCacheMap = new Map();
        this.xhrRequestControllers = [];
        this.isCachingEnabled = this.pricingConstants.CachePolicy.IsCachingEnabled;
    }

    /**
     * Clears the render instances queue for the current page.
     */
    clearRequestManager() {
        this.abortPendingRequests();
        this.renderedInstances = [];
        this.uniqueQuerySet.clear();
        this.responseCacheMap.clear();
    }

    /**
     * Enqueues the rendering instance the requests queue for the current page.
     * @param {ProductPricingRendering} renderInstance - The pricing component rendering instance to enqueue.
     */
    enqueueRequest(renderInstance) {
        // Set the request query key map for the current instance of the rendering pricing component product price manager class

        // Store the render instance in the queue
        this.renderedInstances.push(renderInstance);

        // Adds the request query to the queue if it does not exist
        this.uniqueQuerySet.add(renderInstance.pricingConfig.requestQuery);
    }

    /**
     * Gets the unique cache key for the current request query.
     * @param {string} requestQuery - The request query string. 
     * @returns {string} requestQueryKey - The unique key for the request query, llcc and market.
     */
    getRequestCacheKey(requestQuery) {
        // Create unique key for the request query by combining the locale, product ID, recurrence and payment cadence.
        const keyParameters = new URLSearchParams();
        keyParameters.set("q", requestQuery);

        // Append llcc to the request query with market as cc if available.
        if (this.market) {
            keyParameters.set("llcc", `${this.country}-${this.market}`);
        } else {
            keyParameters.set("llcc", this.locale);
        }

        // Sort the query parameters to create the unique cache key for the request query
        keyParameters.sort();
        // Create the unique cache key for the request query
        const requestQueryKey = keyParameters.toString();

        return requestQueryKey;
    }

    /**
     * Updates the pricing request manager for the current page.
     * @param {string} market - The current selected market for the page.
     */
    updateRequestManager(market) {
        if (this.market !== market) {
            this.market = market;
        }
    }

    /**
     * Combines each request query into group of maximum allowed requests per call.
     * @see {@link ProductPricingConstants.Request.MaxQueryCount}
     * @param {string[]} fetchQueries - The request queries to combine.
     * @returns {string[]} combinedQueries - The combined request queries.
     */
    combineRequestQueries(fetchQueries) {
        // Return empty array if no fetch queries are available
        if (!fetchQueries.length) {
            return [];
        }

        /**
         * @example ["query1,query2,query3,query4,query5", "query6,query7,query8,query9", ...]
         * @type {string[]}
         */
        const combinedQueries = [];

        // Split the request queries into batches of maximum allowed requests per call
        // Since the product pricing API only allows only certain number of queries per request
        for (let i = 0; i < fetchQueries.length; i += this.pricingConstants.Request.MaxQueryCount) {
            const requestQueries = fetchQueries.slice(i, i + this.pricingConstants.Request.MaxQueryCount);
            const combinedRequestQuery = requestQueries.join(",");
            combinedQueries.push(combinedRequestQuery);
        }

        return combinedQueries;
    }

    /**
     * Starts processing the pricing component requests from queue for the current page.
     * @param {(productsResponse: ProductPricingResponse[], relatedRenderedInstances: ProductPricingRendering[]) => void} onFulfilledCallback - The callback function to execute when the fetch request promise is fulfilled.
     * @param {(error: Error, relatedRenderedInstances: ProductPricingRendering[]) => void} onRejectedCallback - The callback function to execute when the fetch request promise is rejected.
     * @param {((this: XMLHttpRequest, ev: Event, relatedRenderedInstances: ProductPricingRendering[]) => void) | null} onStatusChangeCallback - Optional - callback function to execute when the ready state changes.
     * @param {() => void} onRequestsProcessedCallback - Optional - callback function to execute when all the XHR requests are complete and processed.
     */
    processRequests(onFulfilledCallback, onRejectedCallback, onStatusChangeCallback, onRequestsProcessedCallback) {
        /**
         * Pending request queries to be fetched
         * @type {string[]}
         */
        const fetchQueries = [];

        // Send the product pricing requests for each unique request key i.e., query, llcc and market
        this.uniqueQuerySet.forEach((requestQuery) => {
            // Get the render pricing component instances for the current group of request queries
            const renderingManagerInstances = this.renderedInstances.filter(renderInstance => requestQuery === renderInstance.pricingConfig.requestQuery);
            /**
             * Get the cached product pricing response data
             * @type {ProductPricingResponse[]}
             */
            let cachedResponse = [];

            // Check if the current request query is already cached
            if (this.isCachingEnabled) {
                // Get the cached response for the current request query
                // Get the cache key
                const requestQueryKey = this.getRequestCacheKey(requestQuery);

                // Get the cached response by the current request query key
                if (this.responseCacheMap.has(requestQueryKey)) {
                    cachedResponse = this.responseCacheMap.get(requestQueryKey);
                }
            }

            if (cachedResponse.length) {
                // Return the cached product pricing response to each associated rendering manager instance
                onFulfilledCallback(cachedResponse, renderingManagerInstances);
            } else {
                // Add the current request query to the pending request queries
                fetchQueries.push(requestQuery);
            }
        });

        // Combine the pending request queries into batches of maximum allowed requests per call
        const combinedQueries = this.combineRequestQueries(fetchQueries);

        // Fetch pending requests if any
        if (combinedQueries.length) {
            // Send the product pricing request for the current request query
            this.fetchRequest(combinedQueries, onFulfilledCallback, onRejectedCallback, onStatusChangeCallback, onRequestsProcessedCallback);
        } else if (onRequestsProcessedCallback) {
            // Execute the callback function when all the requests are processed and completed
            onRequestsProcessedCallback();
        }
    }

    /**
     * Fetches the product pricing requests for the provided queries.
     * @param {string[]} combinedQueries - Array of combined request queries to be fetched using pricing service.
     * @param {ProductPricingRendering[]} relatedPricingInstances - The associated instances of the SKU rendering manager for the current request query. 
     * @param {(productsResponse: ProductPricingResponse[], relatedPricingInstances: ProductPricingRendering[]) => void} onFulfilledCallback - The callback function to execute when the fetch request promise is fulfilled.
     * @param {(error: Error, relatedPricingInstances: ProductPricingRendering[]) => void} onRejectedCallback - The callback function to execute when the fetch request promise is rejected.
     * @param {((this: XMLHttpRequest, ev: Event, relatedPricingInstances: ProductPricingRendering[]) => void) | null} onStatusChangeCallback - Optional - callback function to execute when the ready state changes.
     * @param {() => void} onRequestsProcessedCallback - Optional - callback function to execute when all the XHR requests are complete and processed.
     */
    fetchRequest(combinedQueries, onFulfilledCallback, onRejectedCallback, onStatusChangeCallback, onRequestsProcessedCallback) {
        combinedQueries.forEach((combinedRequestQuery) => {
            // Get the render pricing component instances for the current group of request queries
            const relatedPricingInstances = this.renderedInstances.filter(renderInstance => combinedRequestQuery.includes(renderInstance.pricingConfig.requestQuery));

            const requestResponse = this.sendRequest(
                this.pricingConstants.Request.Method,
                combinedRequestQuery,
                null,
                function (event) {
                    if (onStatusChangeCallback) {
                        onStatusChangeCallback(this, event, relatedPricingInstances);
                    }
                }
            );

            // Create the product pricing request for the current request query
            requestResponse.then((productsResponse) => {
                this.processSuccessResponse(combinedRequestQuery, productsResponse, onFulfilledCallback);
                this.manageRequestsProgress(onRequestsProcessedCallback);
            }).catch((errorResponse) => {
                onRejectedCallback(errorResponse, relatedPricingInstances);
                this.manageRequestsProgress(onRequestsProcessedCallback);
            });
        });
    }

    /**
     * Manages and tracks the progress status of the product pricing requests.
     * 
     * @param {() => void} onRequestsProcessedCallback - Optional - callback function to execute when all the XHR requests are complete and processed.
     */
    manageRequestsProgress(onRequestsProcessedCallback) {
        // Check if all product-price requests are complete and processed.
        const areAllRequestsComplete = this.xhrRequestControllers.every((xhrRequestController) => xhrRequestController.readyState === XMLHttpRequest.DONE);

        if (areAllRequestsComplete && onRequestsProcessedCallback) {
            // Execute the callback function when all the requests are processed and completed
            onRequestsProcessedCallback();
        }

        // If all the requests are complete, clear the XHR requests controllers
        if (areAllRequestsComplete) {
            // Clear the XHR requests controller
            this.xhrRequestControllers = [];
        }
    }

    /**
     * Processes the product pricing response for the current combined request query.
     * @param {string} combinedQueries - Combined request queries grouped by comma separated values.
     * @param {ProductPricingResponse[]} productsResponse - The product pricing response for the associated SKU instances.
     * @param {(productsResponse: ProductPricingResponse[], relatedPricingInstances: ProductPricingRendering[]) => void} onFulfilledCallback - The callback function to execute when the fetch request promise is fulfilled.
     */
    processSuccessResponse(combinedQueries, productsResponse, onFulfilledCallback) {
        // Separate the combined queries into individual request queries
        const requestQueries = combinedQueries.split(",");

        requestQueries.forEach((requestQuery) => {
            // Get the product pricing response for the current request query
            // Filter the product pricing response data by component request query and PUID from response
            const responseData = productsResponse.filter(productResponse => requestQuery === productResponse.puid);
            // Get the render pricing component instances for the current request query
            const relatedPricingInstances = this.renderedInstances.filter(renderInstance => requestQuery === renderInstance.pricingConfig.requestQuery);

            // Cache the product pricing response for the current request query if caching is enabled
            if (this.isCachingEnabled) {
                // Get the cache key
                const requestQueryKey = this.getRequestCacheKey(requestQuery);
                // Cache the product pricing response for the current request query
                this.responseCacheMap.set(requestQueryKey, responseData);
            }

            // Return the product pricing response data to each associated rendering manager instance
            onFulfilledCallback(responseData, relatedPricingInstances);
        });
    }

    /**
     * Gets the request URI for the product pricing request.
     * @param {string} query - The query string for the request.
     * @returns {string} requestUri - The request URI for the product pricing request.
     */
    getRequestUri(query) {
        // Get catalog product price relative URI
        const relativeUri = this.pricingConstants.Request.RelativeUri;
        // Set query parameters
        const queryParameters = new URLSearchParams();
        queryParameters.set("q", query);

        // Append llcc to the request query with market as cc if available.
        if (this.market) {
            queryParameters.set("llcc", `${this.country}-${this.market}`);
        } else {
            queryParameters.set("llcc", this.locale)
        }

        // Add default query parameters
        for (const parameterKey in this.pricingConstants.Request.QueryParameters) {
            queryParameters.set(parameterKey, this.pricingConstants.Request.QueryParameters[parameterKey]);
        }

        return OneCloudUtil.getMsocapiurl(relativeUri, queryParameters.toString());
    }

    /**
     * Aborts any pending or in-progress XHR requests.
     */
    abortPendingRequests() {
        // Abort any pending or in-progress XHR requests
        this.xhrRequestControllers.forEach((xhr) => {
            xhr.abort();
        });

        // Clear the XHR requests controller
        this.xhrRequestControllers = [];
    }

    /**
     * Sends the product pricing request.
     * @param {string} method - The HTTP request method type. 
     * @param {string} query - The query string for the request.
     * @param {Record<string, string> | null} requestHeaders - Optional - additional request headers to add to the xhr request.
     * @param {((this: XMLHttpRequest, ev: Event) => void) | null} onReadyStateChange - Optional - callback function to execute when the ready state changes.
     * @returns {Promise<ProductPricingResponse[]> | Promise<Error>} requestResult - Either the promise resolve or reject for the product pricing request.
     */
    sendRequest(method, query, requestHeaders = null, onReadyStateChange = null) {
        const requestResult = new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            // Set the xhr request controller for the current request query
            this.xhrRequestControllers.push(xhr);
            const requestUri = this.getRequestUri(query);
            xhr.onreadystatechange = onReadyStateChange;
            xhr.open(method, requestUri);
            this.addRequestHeaders(xhr, requestHeaders);
            xhr.onload = function (ev) {
                if (this.readyState === XMLHttpRequest.DONE) {
                    if (this.status === 200) {
                        const parsedResponse = JSON.parse(this.response);
                        resolve(parsedResponse);
                    } else {
                        const errorResponse = window.ocReimagine.ProductPriceModule.ProductPricingRequest.createRejectResponse(this, ev);

                        reject(errorResponse);
                    }
                }
            };
            xhr.onerror = function (ev) {
                const errorResponse = window.ocReimagine.ProductPriceModule.ProductPricingRequest.createRejectResponse(this, ev);

                reject(errorResponse);
            };
            xhr.send();
        });

        return requestResult;
    }

    /**
     * Adds request headers to the xhr request.
     * @param {XMLHttpRequest} xhr - The xhr request instance.
     * @param {Record<string, string> | null} requestHeaders - Optional - additional request headers to add to the xhr request.
     */
    addRequestHeaders(xhr, requestHeaders = null) {
        const defaultHeaders = this.pricingConstants.Request.Headers;

        for (const defaultHeader in defaultHeaders) {
            xhr.setRequestHeader(defaultHeader, defaultHeaders[defaultHeader]);
        }

        if (requestHeaders) {
            for (const additionalHeader in requestHeaders) {
                xhr.setRequestHeader(additionalHeader, requestHeaders[additionalHeader]);
            }
        }
    }

    /**
     * Creates the error response for the product pricing request.
     * @param {XMLHttpRequest} xhr - The instance of current XMLHttpRequest request.
     * @param {ProgressEvent<EventTarget>} ev - The progress event for the current XMLHttpRequest request.
     * @returns {Error} errorResponse - The error response for the product pricing request.
     */
    static createRejectResponse(xhr, ev) {
        const errorMessage = xhr.response ? xhr.response
            : xhr.responseText ? xhr.responseText
                : xhr.statusText ? xhr.statusText
                    : "Unknown error";
        const errorResponse = new Error(errorMessage);
        errorResponse.name = xhr.status.toString();

        return errorResponse;
    }
}

new (function (document, $) {
	"use strict";

	const SUCCESS_RESPONSE_CODE = "Success";
	const SHARED_DATA_SELECTOR = ".oc-shared-pricing-data";
	const PURCHASE_MAIN_SELECTOR = "[data-oc-product~='purchase']";
	const NOT_AVAILABLE_SELECTOR = "[data-oc-product~='not-available'] p"
	const COMMERCIAL_TAX_DISCLAIMER_SELECTOR = "[data-oc-shared-data='oc-tax-disclaimer'] p";
	const CONSUMER_TAX_DISCLAIMER_SELECTOR = "[data-oc-shared-data='oc-consumer-tax-disclmr'] p";
	const DATA_OC_PRODUCT_ATTRIBUTE = "data-oc-product";
	const OC_COMMERCIAL_TAX_DISCLAIMER_ATTRIBUTE = "oc-tax-disclaimer";
	const OC_CONSUMER_TAX_DISCLAIMER_ATTRIBUTE = "oc-consumer-tax-disclmr";

	/**
	 * On page load.
	 */
	$(document).on("DOMContentLoaded", () => {
		replaceSharedData();
		updateAccessibilityAttributes();
	});


	/**
	 * On market selector complete.
	 */
	$(document).on("onComplete", () => {
		updateTokenTextMainResponseCode();
		updateAccessibilityAttributes();
		replaceSharedData();
	});

	/**
	 * Replaces the shared data elements inner html with the data from the shared data element depending on key.
	 * @returns {void}
	 */
	function replaceSharedData() {

		const PURCHASE_MAIN_ELEMENTS = document.querySelectorAll(PURCHASE_MAIN_SELECTOR);

		if (!PURCHASE_MAIN_ELEMENTS) return;

		PURCHASE_MAIN_ELEMENTS.forEach((elem) => {

			const RESPONSE_CODE = elem.getAttribute(DATA_OC_PRODUCT_ATTRIBUTE).split(" ")[2];
			const SHARED_DATA_ELEM = document.querySelector(SHARED_DATA_SELECTOR);
			let commercialTaxDisclaimerPlaceholder = elem.querySelector(COMMERCIAL_TAX_DISCLAIMER_SELECTOR);
			let consumerTaxDisclaimerPlaceholder = elem.querySelector(CONSUMER_TAX_DISCLAIMER_SELECTOR);
			let notAvailablePlaceholder = elem.querySelector(NOT_AVAILABLE_SELECTOR);

			if (!SHARED_DATA_ELEM) return;

			if (notAvailablePlaceholder && RESPONSE_CODE) {
				notAvailablePlaceholder.innerHTML = SHARED_DATA_ELEM.getAttribute(RESPONSE_CODE);
			}

			if (commercialTaxDisclaimerPlaceholder) {
				commercialTaxDisclaimerPlaceholder.innerHTML = SHARED_DATA_ELEM.getAttribute(OC_COMMERCIAL_TAX_DISCLAIMER_ATTRIBUTE);
			}

			if (consumerTaxDisclaimerPlaceholder) {
				consumerTaxDisclaimerPlaceholder.innerHTML = SHARED_DATA_ELEM.getAttribute(OC_CONSUMER_TAX_DISCLAIMER_ATTRIBUTE);
			}
		});
	}

	/**
	 * Updates the accessibility attributes for the product pricing hidden and visible elements.
	 */
	function updateAccessibilityAttributes() {

		const PURCHASE_MAIN_ELEMENTS = document.querySelectorAll(PURCHASE_MAIN_SELECTOR);

		if (!PURCHASE_MAIN_ELEMENTS) return;

		PURCHASE_MAIN_ELEMENTS.forEach((elem) => {

			const RESPONSE_CODE = elem.getAttribute(DATA_OC_PRODUCT_ATTRIBUTE).split(" ")[2];

			let commercialTaxDisclaimerPlaceholder = elem.querySelector(COMMERCIAL_TAX_DISCLAIMER_SELECTOR);
			let consumerTaxDisclaimerPlaceholder = elem.querySelector(CONSUMER_TAX_DISCLAIMER_SELECTOR);
			let notAvailablePlaceholder = elem.querySelector(NOT_AVAILABLE_SELECTOR);

			if (RESPONSE_CODE === SUCCESS_RESPONSE_CODE) {

				if (commercialTaxDisclaimerPlaceholder) {
					commercialTaxDisclaimerPlaceholder.removeAttribute("aria-hidden");
				}

				if (consumerTaxDisclaimerPlaceholder) {
					consumerTaxDisclaimerPlaceholder.removeAttribute("aria-hidden");
				}

				if (notAvailablePlaceholder) {
					notAvailablePlaceholder.setAttribute("aria-hidden", "true");
				}

			} else {

				if (commercialTaxDisclaimerPlaceholder) {
					commercialTaxDisclaimerPlaceholder.setAttribute("aria-hidden", "true");
				}

				if (consumerTaxDisclaimerPlaceholder) {
					consumerTaxDisclaimerPlaceholder.setAttribute("aria-hidden", "true");
				}

				if (notAvailablePlaceholder) {
					notAvailablePlaceholder.removeAttribute("aria-hidden");
				}
			}

		});
	}

	/**
	 * Iterates through all token text elements and updates the main response code to the first non-success response code.
	 */
	function updateTokenTextMainResponseCode() {
		const TOKEN_TEXT_ELEMENTS = document.querySelectorAll("[data-token-text]");
		TOKEN_TEXT_ELEMENTS.forEach((tokenTextElem) => {
			const purchaseMainElement = tokenTextElem.querySelector("[data-oc-product*=purchase][data-oc-product*=main]");
			if (!purchaseMainElement) return;

			const PRICING_TOKEN_ELEMENTS = tokenTextElem.querySelectorAll("[data-oc-product*=purchase]:not([data-oc-product*=main])[data-token=m365ProductPrice]");
			if (!PRICING_TOKEN_ELEMENTS || !PRICING_TOKEN_ELEMENTS.length) return;

			let responseCode = SUCCESS_RESPONSE_CODE;
			for (const pricingTokenElem of PRICING_TOKEN_ELEMENTS) {
				let curResponseCode = pricingTokenElem.getAttribute(DATA_OC_PRODUCT_ATTRIBUTE).split(" ")[1];
				if (curResponseCode !== SUCCESS_RESPONSE_CODE) {
					responseCode = curResponseCode;
					break;
				}
			}

			let currentMainProductAttribute = purchaseMainElement.getAttribute(DATA_OC_PRODUCT_ATTRIBUTE);
			let currentMainResponseCode = currentMainProductAttribute.split(" ")[2];
			purchaseMainElement.setAttribute(DATA_OC_PRODUCT_ATTRIBUTE, currentMainProductAttribute.replace(currentMainResponseCode, responseCode));
		});
	}

})(document, $);

//#region Reimagine Product Pricing Rendering class.
/**
 * Manages rendering of product pricing component.
 * @note This class is not related with above script and is managed by product-pricing-manager script.
 */
window.ocReimagine.ProductPriceModule.ProductPricingRendering = class ProductPricingRendering {
	/**
	 * Gets the constants for the product pricing module.
	 */
	pricingConstants = window.ocReimagine.ProductPriceModule.ProductPricingConstants;

	/**
	 * Gets the pricing component templates.
	 */
	pricingTemplates = window.ocReimagine.ProductPriceModule.ProductPricingTemplates;

	/**
	 * Gets or sets the target pricing component element.
	 * @type {HTMLDivElement}
	 */
	pricingComponentElement;

	/**
	 * Gets or sets the render section element.
	 * @type {HTMLDivElement}
	 */
	renderSectionElement;

	/**
	 * Gets or sets the pricing template fragment.
	 * @type {HTMLTemplateElement}
	 */
	pricingTemplateElement;

	/**
	 * Gets or sets the pricing config attributes for the current product sku request.
	 * @type {PricingConfig}
	 */
	pricingConfig;

	/**
	 * Gets or sets the product pricing response for the current product sku request.
	 * @type {ProductPricingResponse[]}
	 */
	#productPriceResponse;

	/**
	 * Gets the product pricing response data for the current product pricing config.
	 * @returns {ProductPricingResponse[]} product pricing response data
	 */
	get productPriceResponse() {
		return this.#productPriceResponse;
	}

	/**
	 * Sets the product pricing response data for the current product pricing request.
	 * @param {ProductPricingResponse[]} value product pricing response data
	 */
	set productPriceResponse(value) {
		this.#productPriceResponse = value;
	}

	/**
	 * Initializes new instance of the product pricing rendering handler class.
	 * @param {HTMLDivElement} pricingComponentElement target pricing component element
	 */
	constructor(pricingComponentElement) {
		if (!pricingComponentElement) {
			return;
		}

		// Get pricing component element.
		this.pricingComponentElement = pricingComponentElement;

		// Get render section element.
		this.renderSectionElement = this.pricingComponentElement.querySelector(this.pricingConstants.Selectors.Dataset.RenderSection);

		// Get pricing component server-side config-template.
		this.pricingTemplateElement = this.pricingComponentElement.querySelector(this.pricingConstants.Selectors.Dataset.PricingConfig);
		const configData = this.pricingTemplateElement?.dataset.ocrPricingConfig;

		if (configData) {
			this.pricingConfig = JSON.parse(configData);
		}
	}

	/**
	 * Handles the product pricing request response for the current reiamgine SKU request.
	 * @param {HTMLDivElement} skuElement - The SKU element on the page. 
	 * @param {ProductPricingResponse[]} pricingResponse - The pricing data for the sku element.
	 */
	handleProductPricingResponse() {
		if (!this.productPriceResponse || !this.productPriceResponse.length) {
			this.displayUnavailable();
			return;
		}

		const pricingResponse = this.productPriceResponse[0];
		// Update the pricing config.
		this.updatePricingConfig(pricingResponse);

		switch (pricingResponse.responseCode) {
			case this.pricingConstants.Enumerables.Response.Success:
				this.displayAvailableTemplate(pricingResponse);
				break;
			case this.pricingConstants.Enumerables.Response.DisabledMarket:
				this.displayDisabledMarket();
				break;
			default:
				this.displayUnavailable();
				break;
		}
	}

	/**
	 * Updates the config for the current product pricing rendering instance.
	 * @param {ProductPricingResponse} pricingResponse pricing response object. 
	 */
	updatePricingConfig(pricingResponse) {
		// Assign product title from override
		this.pricingConfig.renderTitle = this.pricingConfig.titleOverride;

		// Update edit mode flag
		this.pricingConfig.isEdit = this.pricingTemplateElement.hasAttribute("data-editor");

		if (!pricingResponse || !pricingResponse.sku) {
			return;
		}

		// Get product price has discount or not.
		this.pricingConfig.isDiscounted = pricingResponse.sku.discountPrice > 0;

		// Get the render title
		if (this.pricingConfig.titleOverride) {
			this.pricingConfig.renderTitle = this.pricingConfig.titleOverride;
		} else if (this.pricingConfig.isUsingProductTitle) {
			this.pricingConfig.renderTitle = pricingResponse.title;
		} else {
			this.pricingConfig.renderTitle = pricingResponse.sku.title;
		}
	}

	/**
	 * Renders the template fragment for the current pricing component instance.
	 * @param {DocumentFragment} templateFragment template fragment to be rendered.
	 */
	renderTemplateFragment(templateFragment) {
		if (this.pricingConfig.isEdit) {
			// Keep the authored content in the rendered content section and only replace configured sections from template fragment.
			this.replaceRenderedContent(templateFragment);
		} else {
			// Replace entire render section element with content from template fragment.
			this.renderSectionElement.replaceChildren(templateFragment);
		}
	}

	/**
	 * Saves the authored content for the current product pricing rendering instance.
	 * @param {DocumentFragment} templateFragment configured template fragment to be used for rendered.
	 */
	replaceRenderedContent(templateFragment) {
		// Replace the placeholder sections within rendered content element by replacing with content from configured template.
		for (const renderedElement of this.renderSectionElement.children) {
			const attributeValue = renderedElement.dataset.ocrPricingRender;
			const templateElement = templateFragment.querySelector(`[data-ocr-pricing-render="${attributeValue}"]`);

			if (templateElement) {
				renderedElement.replaceWith(templateElement);
			}
		}
	}

	/**
	 * Prepares and displays available template in the current product sku element on the page.
	 * @param {ProductPricingResponse} pricingResponse pricing response object.  
	 */
	displayAvailableTemplate(pricingResponse) {
		const templateName = this.pricingComponentElement.dataset.ocrPricingComponent;
		const templateFragment = this.pricingTemplates.getAvailableTemplate(
			this.pricingTemplateElement,
			templateName,
			this.pricingConfig,
			pricingResponse);
		this.renderTemplateFragment(templateFragment);
	}

	/**
	 * Hides the pricing section and displays the unavailable section.
	 * @param {HTMLDivElement} skuElement target pricing component element
	 */
	displayUnavailable() {
		const templateFragment = this.pricingTemplates.getUnavailableTemplate(this.pricingConfig, this.pricingTemplateElement);
		this.renderTemplateFragment(templateFragment);
	}

	/**
	 * Hides the pricing section and displays the disabled market section.
	 * @param {HTMLDivElement} skuElement target pricing component element
	 */
	displayDisabledMarket() {
		const templateFragment = this.pricingTemplates.getDisabledMarketTemplate(this.pricingConfig, this.pricingTemplateElement);
		this.renderTemplateFragment(templateFragment);
	}
}
//#endregion Reimagine Product Pricing Rendered Instance Manager
/**
 * @class ProductPricingManager - Manages the product pricing data and updates the UI
 */
window.ocReimagine.ProductPriceModule.ProductPricingManager = class ProductPricingManager {
    /**
     * Gets the constants for the product pricing module.
     * @type {ProductPricingConstants}
     */
    pricingConstants = window.ocReimagine.ProductPriceModule.ProductPricingConstants;

    /**
     * Gets or sets the pricing component elements on the current page.
     * @type {NodeListOf<HTMLDivElement>}
     */
    pricingComponentElements;

    /**
     * Gets or sets the market selector element on the current page.
     * @type {HTMLDivElement}
     */
    marketSelector;

    /**
     * Gets or sets the current locale for the page.
     * @type {string}
     */
    locale;

    /**
     * Gets or sets the country for the page.
     * @type {string}
     */
    country;

    /**
     * Gets or sets the market for the page.
     * @type {string | null}
     */
    market = null;

    /**
     * Gets or sets the market selector config options from data-layer attributes.
     * @type {MarketSelectorConfig}
     */
    marketSelectorOptions;

    /**
     * Gets or sets the instance of product pricing request manager class.
     * @type {ProductPricingRequest}
     */
    productPricingRequestManager;

    /**
     * Gets or sets the instances of product pricing rendering class for each pricing component on page.
     * @type {Array<ProductPricingRendering>}
     */
    pricingComponentRenderInstances;

    /**
     * Gets or sets the flag to indicate if the pricing request mode is ajax.
     * @type {boolean}
     */
    isPricingRequestModeAjax;

    /**
     * Gets or sets the flag indicating whether the product pricing manager is initialized.
     * @type {boolean}
     */
    isPricingManagerInitialized = false;

    /**
     * Creates instance of the product pricing manager and associated services
     */
    constructor() {
        // Initialize product pricing manager
        this.initializePricingManager();
    }

    /**
     * Initializes the pricing manager and request manager
     * Creates list of product price rendering instances of all elements with data-ocr-pricing-component
     * Request collection is managed by pricing request script, contains all the unique queries from data-sku-request
     */
    initializePricingManager() {
        // Get current locale, country and selected market from the URL
        const documentLang = document.documentElement.lang || this.pricingConstants.Defaults.Locale;
        this.locale = documentLang;
        this.country = documentLang.split("-")[0];
        // Initial market value must be set after the on refreshed event is dispatched by market-selector script
        // this.market property is set during onMarketSelectorChange

        // Get pricing components.
        this.pricingComponentElements = this.getPricingComponents();

        // Initialize instance of product pricing request manager class
        this.productPricingRequestManager = new window.ocReimagine.ProductPriceModule.ProductPricingRequest(documentLang, this.country, this.market);

        // Creates and enqueues requests for all the reimagine pricing component instances on the current page
        this.createProductPricingRequests();

        this.marketSelector = this.getMarketSelector();

        if (this.isPricingManagerInitialized) {
            // if market selector is available on the page, set the market selector config and bind events
            if (this.marketSelector) {
                // Set the market selector config options from data-layer attributes
                this.setMarketSelectorConfig();
                // Bind the market selector events
                this.bindEvents();
                // Reset the pricing request mode to false as market selector on refreshed event will initialize the content
                // This is to avoid calling the processRequests twice since on page load market selector's on refreshed will do the same.
                this.isPricingRequestModeAjax = false;
            }

            // if request-mode ajax feature-switch is enabled then send client-side product pricing requests on page load
            // otherwise on initial page load, the product pricing requests are made from the server-side by OSGi/ESI service
            if (this.isPricingRequestModeAjax) {
                // Start processing the requests
                this.productPricingRequestManager.processRequests(
                    (productsResponse, relatedRenderedInstances) => this.handleRequestSuccess(productsResponse, relatedRenderedInstances),
                    (error, relatedRenderedInstances) => this.handleRequestFailure(error, relatedRenderedInstances),
                    this.handleRequestStatusChange,
                    () => this.handleRequestsComplete()
                    );
            }
        }
    }

    /**
     * Gets the pricing component elements on the current page.
     * Finds the pricing component elements by the [data-ocr-pricing-component] attribute selector.
     * @returns {NodeListOf<HTMLDivElement>} The pricing component elements on the current page.
     */
    getPricingComponents() {
        return document.querySelectorAll(this.pricingConstants.Selectors.Dataset.Component);
    }

    /**
     * Gets the market selector element on the current page.
     * @returns {HTMLDivElement} marketSelector - The market selector element on the current page.
     */
    getMarketSelector() {
        return document.querySelector(this.pricingConstants.Selectors.Dataset.MarketSelector);
    }

    /**
     * Sets the market selector configuration options from data-layer attributes.
     */
    setMarketSelectorConfig() {
        this.marketSelectorOptions = {
            refreshMode: this.marketSelector.dataset.refreshMode,
            isRefreshModeAjax: this.marketSelector.dataset.refreshMode === this.pricingConstants.Parameters.MarketSelector.RefreshMode.AJAX
        }
    }

    /**
     * Binds the market selector events for the product pricing manager.
     */
    bindEvents() {
        if (this.marketSelectorOptions.isRefreshModeAjax && oc.event.marketSelector) {
            // This runs on first/initial page load event on document ready state and sub-sequent market selection changes
            document.body.addEventListener(this.pricingConstants.Events.MarketSelector.OnRefreshed, (ev) => { this.onMarketSelectorChange(ev); });
        }
    }

    /**
     * Handles the market selector change event.
     * @param {CustomEvent} event the on select event of market selector dropdown.
     */
    onMarketSelectorChange(event) {
        if (event.detail.value && event.detail.value !== this.market) {
            this.market = event.detail.value;
            this.productPricingRequestManager.market = event.detail.value;
            // Update the product pricing request manager request-response queue map
            this.productPricingRequestManager.updateRequestManager(event.detail.value);
            // Cancel all existing pending or in-progress requests
            this.productPricingRequestManager.abortPendingRequests();
            // Start processing the requests
            this.productPricingRequestManager.processRequests(
                (productsResponse, relatedRenderedInstances) => this.handleRequestSuccess(productsResponse, relatedRenderedInstances),
                (error, relatedRenderedInstances) => this.handleRequestFailure(error, relatedRenderedInstances),
                this.handleRequestStatusChange,
                () => this.handleRequestsComplete()
                );
        }
    }

    /**
     * Creates and enqueues product pricing requests for all the reimagine pricing components on the current page.
     */
    createProductPricingRequests() {
        if (this.pricingComponentElements?.length) {
            try {
                // Create the product pricing requests for each pricing component element
                for (const pricingComponentElement of this.pricingComponentElements) {

                    // Initialize instance of product price rendering class for the pricing component.
                    // This rendering class is what updates the UI for the pricing component depending on the product pricing response.
                    const productPricingRender = new window.ocReimagine.ProductPriceModule.ProductPricingRendering(pricingComponentElement);
                    const requestQuery = productPricingRender.pricingConfig.requestQuery;
                    const isProductPriceOverridden = productPricingRender.pricingConfig.isProductPriceOverridden;
                    // Get pricing request mode from the pricing component element
                    this.isPricingRequestModeAjax = productPricingRender.pricingConfig.isRequestModeAjax;

                    // if sku request query is available and product price is not overridden, only then send the product pricing request
                    // otherwise we ignore the current instance of reimagine pricing component
                    if (requestQuery && !isProductPriceOverridden) {
                        this.productPricingRequestManager.enqueueRequest(productPricingRender);
                    }
                }

                // Get the instances of product pricing rendering class for each SKU component on page
                this.pricingComponentRenderInstances = this.productPricingRequestManager.renderedInstances;
                this.isPricingManagerInitialized = this.pricingComponentRenderInstances.length > 0;
            }
            catch (e) {
                this.isPricingManagerInitialized = false;
            }
        }
    }

    /**
     * Updates the product pricing request instances on page edit when dialog is submitted.
     */
    updateProductPricingRequests() {
        // TODO: for now, the page is reloaded on authoring dialog submit.
        // In future, we can update the product pricing request instances on authoring changes. 
    }

    /**
     * Handles the product pricing request status change for provided pricing component instances.
     * @param {XMLHttpRequest} xhr - The XMLHttpRequest object for the product pricing request.
     * @param {Event} event - The event object for the product pricing request.
     * @param {ProductPricingRendering[]} renderManagerInstances - Grouped instances of product pricing rendering class associated with same requests.
     */
    handleRequestStatusChange(xhr, event, renderManagerInstances) {
        // TODO: add in-progress status handling - loading animation or spinner
    }

    /**
     * Manages the product pricing request success for provided pricing component instances.
     * @param {ProductPricingResponse[]} productsResponse - The product pricing response for the associated SKU instances.
     * @param {ProductPricingRendering[]} renderManagerInstances - Grouped instances of product pricing rendering class associated with same requests.
     */
    handleRequestSuccess(productsResponse, renderManagerInstances) {
        // Assign and hanlde the product pricing response to each pricing component rendering class instance
        renderManagerInstances.forEach(renderingClassInstance => {
            renderingClassInstance.productPriceResponse = productsResponse;
            renderingClassInstance.handleProductPricingResponse();
        });
    }

    /**
     * Handles the product pricing request failure for provided pricing component instances.
     * @param {Error} error - The error object for the failed product pricing request.
     * @param {Array<ProductPricingRendering>} renderManagerInstances - Grouped instances of product pricing rendering class associated with same requests.
     */
    handleRequestFailure(error, renderManagerInstances) {
        // Display the product pricing unavailable for each SKU rendering class instance
        renderManagerInstances.forEach(renderingClassInstance => renderingClassInstance.displayUnavailable());
    }

    /**
     * Handles the callback when all the product pricing requests are complete and processed.
     */
    handleRequestsComplete() {
        if (!window.ocrReimagine) {
            return;
        }
        // Re-initialize popover component and/or pricing-tokens inside rich-text after rendering the template content.
        this.reinitializeComponents();
        // Regenerates FWLinks after the product pricing is rendered from a 'static' template.
        this.regenerateFWLinkParams();
    }

    /**
     * Re-initializes the popover component and/or pricing-tokens inside rich-text for the all the product pricing instances.
     * 
     * @summary Since the product pricing component content is rendered dynamically from authored template and configured template,
     * the popover component and/or pricing-tokens inside rich-text will not be initialized as they are within the template section
     * and not actually rendered on the page. This method re-initializes the popover component and/or pricing-tokens inside rich-text.
     */
    reinitializeComponents() {
        // Try to re-initialize popover content and/or pricing-tokens scripts to update content functionality after it is rendered from template.
        try {
            if (window.ocrReimagine.PopoverRichTextPlugin) {
                // Re-initialize popover rich text plugin script.
                window.ocrReimagine.PopoverRichTextPlugin.initializePopoverRichTextPlugin();
            }
        } catch (e) {
        }
    }

    /*
    * Regenerates FWLinks by calling the Market Selector's function that handles setting the FWLinkParams.
    */
    regenerateFWLinkParams() {
        if (!window.ocrReimagine.MarketSelector) {
            return;
        }

        try {
            // Regenerate the FWLinkParams after the product pricing is rendered.
            window.ocrReimagine.MarketSelector.setFWLinksQueryParams(window.ocrReimagine.MarketSelector.instance.fwlinkParams);
        } catch (e) {
            // No error handling.
        }
    }
}
new (function () {
    // Check if edit mode is enabled and page is loaded
    const isEditing = window.Granite && window.CQ && document.querySelector("[data-editor]") && document.readyState === "complete";

    if (isEditing) {
        // Update the product pricing module
        updateProductPriceModule();
    }

    /**
     * Updates the reimagine product pricing manager and services on page edit when dialog is submitted.
     * 
     * @returns void
     */
    function updateProductPriceModule() {
        try {
            // Check if product pricing manager instance exists
            if (window.ocReimagine && window.ocReimagine.ProductPriceModule && window.ocReimagine.ProductPriceModule.PricingManagerInstance) {
                return;
            }

            // TODO: on page edit mode update product pricing manager instance on SKU component cq dialog submit event
            // window.ocReimagine.ProductPriceModule.PricingManagerInstance.updatePricingInstances();
        }
        catch (error) {
        }
    }
});
