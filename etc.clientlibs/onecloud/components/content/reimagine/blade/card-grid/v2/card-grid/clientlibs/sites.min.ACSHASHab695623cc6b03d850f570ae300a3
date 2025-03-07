if (!window.CardGridCarousel) {
    window.CardGridCarousel = class CardGridCarousel {
        constructor(opts) {
            this.SELECTORS = {
                carousel: ".carousel",
                carouselCardsContainer: ".carousel-product-card .appsource-cards-container",
                gridCardsContainer: ".card-grid__cards .appsource-cards-container",
                carouselSpinner: ".appsource-spinner-container",
                prevBtn: ".carousel__arrow-prev",
                nextBtn: ".carousel__arrow-next",
            };

            this.STRINGS = {
                combobox: "COMBOBOX",
                tab: "TAB",
                appSourceFeatured: "appSourceFeatured",
                GRID: "GRID",
                CAROUSEL: "CAROUSEL",
                LEARN_MORE: "Learn More",
                FREE: "Free",
            };

            this.ELEMENTS = {};

            this.CONFIG = {
                payloadProxy: {},
                compId: opts.compId,
                locale: document.documentElement.lang
            };

            this.MAPS = {
                tabFilters: window.appsource.tabFiltersMap,
                productType: window.appsource.productTypeMap,
                cardGridType: {
                    appSourceTrendingApps: this.STRINGS.GRID,
                    appSourceWhatsNew: this.STRINGS.GRID,
                    appSourceMostViewed: this.STRINGS.CAROUSEL
                },
                pricingTextVariants: ["Free", "FreeTrial"],
                allSnapCarousels: []
            };

            this._getCardTmplFromDOM = () => {
                const tmplDOMSelector = `${this.CONFIG.cardConfig.tmplDOMSelector}_${this.CONFIG.compUUID}`;
                return document.querySelector(tmplDOMSelector).innerHTML.toString().trim();
            };

            this._getCarouselType = (wrapper) => {
                return wrapper.dataset.carouseltype;
            };

            this._readConfigObject = (carouselType) => {
                return carouselConfig.find((configObject) => configObject.carouselType == carouselType);
            };

            this._setupElements = (wrapper) => {
                this.ELEMENTS = {
                    ...this.ELEMENTS,
                    carousel: wrapper.querySelector(this.SELECTORS.carousel),
                    cardsContainer: wrapper.querySelector(this.SELECTORS.carouselCardsContainer),
                };

                this.CONFIG.carouselType = this._getCarouselType(wrapper);
                this.CONFIG.cardConfig = this._readConfigObject(this.CONFIG.carouselType);
                this.CONFIG.compUUID = wrapper.dataset.compid;
                this.CONFIG.cardTmpl = this._getCardTmplFromDOM();
                this.CONFIG.apiEndpoint= wrapper.dataset.apiendpoint;
                this.CONFIG.spinnerElement = wrapper.querySelector(this.SELECTORS.carouselSpinner);
            };

            // read params from url
            this._readURLParams = () => {
                const urlParams = new URLSearchParams(window.location.search);
                const requiredURLParams = {};

                this.CONFIG.cardConfig.requiredURLParams.forEach((param) => {
                    requiredURLParams[param.urlKey] = (urlParams.get(param.urlKey) || "").trim();
                });
                return requiredURLParams;
            };

            this._getFilterKeyFromMap = (urlKey) => {
                const mapObj = this.MAPS.tabFilters.find((obj) => obj.urlKey == urlKey);
                return mapObj.apiKey || "";
            };

            // clear endpoint data before building filter query params
            this._cleanEndpointData = () => {
                const epData = this.CONFIG.cardConfig.endpointPayload.data;

                epData.categories && delete epData.categories;
                epData.industries && delete epData.industries;
                epData.productTypes && delete epData.productTypes;
                epData.filter && delete epData.filter;
            };

            this._buildFilterQueryParams = (carouselCardsParam) => {
                const urlParams = this._readURLParams();
                const tabFilterObj = urlParams.filterTab == "" ?  carouselCardsParam : this._readURLParams();
                
                let queryParams = {};
                this._cleanEndpointData();
                queryParams.categories && delete queryParams.categories;
                queryParams.industries && delete queryParams.industries;
                queryParams.productTypes && delete queryParams.productTypes;
                queryParams.filter && delete queryParams.filter;

                this.CONFIG.cardConfig.requiredURLParams.forEach((param) => {
                    if (param.urlKey != 'filterTab' && !!tabFilterObj[param.urlKey]) {
                        queryParams[param.apiKey] = this._getFilterKeyFromMap(tabFilterObj[param.urlKey])
                    }
                });
                return queryParams;
            };

            this._updateNumberOfCarouselCards = (wrapper) => {
                const definedTop = this.CONFIG.cardConfig.endpointPayload.data.top;
                const numberOfAppCards = wrapper.dataset.numberofappcards;
                return (!numberOfAppCards || numberOfAppCards == "") ? definedTop : numberOfAppCards;
            };

            this._buildPayloadData = (wrapper, carouselCardsParam) => {
                this._cleanEndpointData();
                const configPayload = {...this.CONFIG.cardConfig.endpointPayload.data};
                let queryParams = {};
                if (this.CONFIG.cardConfig.endpointPayload.isFilterable) {
                    queryParams = this._buildFilterQueryParams(carouselCardsParam);
                }
                const numberOfAppCards = this._updateNumberOfCarouselCards(wrapper);

                this.CONFIG.cardConfig.endpointPayload.data = {
                    ...configPayload,
                    ...queryParams,
                    top: numberOfAppCards
                };
 
            };

            this._getProductTypeFromMap = (productType) => {
                const foundType = this.MAPS.productType.find((type) => {
                    return type.offerType.toLowerCase() === productType.toLowerCase();
                });
                if (foundType) {
                    return foundType.urlKey;
                }
            };

            this._getPageOrigin = () => {
                return (location.hostname === "localhost" || location.hostname === "127.0.0.1") ? `https://appsource.microsoft.com` : `${window.location.origin}`;
            }

            this._buildProductURL = (item) => {
                const renderApiKey = this.CONFIG.cardConfig.renderAttributes.find ((attr) => attr.renderKey == "appType").apiKey;
                const appType = this._getProductTypeFromMap(item[renderApiKey]);
                const appId = item[this.CONFIG.cardConfig.renderAttributes.find((attr) => attr.renderKey == "appId").apiKey];
                const origin = this._getPageOrigin();
                return `${origin}/${this.CONFIG.locale}/product/${appType}/${appId}?tab=Overview`;
                
            };

            this._buildSeeAllURL = () => {
                const urlParams = this._readURLParams();
                const filterKeyObj = this.MAPS.tabFilters.find((each) => each.tabKey == urlParams.filterTab);
                const origin = this._getPageOrigin();
                let seeAllURL = `${origin}/${this.CONFIG.locale}/marketplace/apps`;
                if (!!filterKeyObj) {
                    const { urlKey, pdpKey } = this.CONFIG.cardConfig.requiredURLParams.find((param) => param.tabKey == filterKeyObj.tabKey);
                    if (pdpKey && urlParams[urlKey]) {
                        seeAllURL += `?${pdpKey}=${urlParams[urlKey]}`;
                    }
                }

                return seeAllURL;
            };

            this._updateSeeAllURL = () => {
                if (!this.ELEMENTS.headingContainer) return;
                const seeAllLink = this.ELEMENTS.headingContainer.querySelector(".link-group a");

                if (!seeAllLink) return;
                const seeAllURL = new URL(this._buildSeeAllURL()).toString();

                seeAllLink.setAttribute("href", seeAllURL);
            };

            this._buildRenderObject = (apiResponse) => {
                const attributeMap = this.CONFIG.cardConfig.renderAttributes;

                return apiResponse[this.CONFIG.cardConfig.resultsObject].map((item) => {
                    const renderTmp = {};

                    attributeMap.forEach((attr) => {
                        let attrValue = "";
                        switch (attr.renderKey.toLowerCase()) {
                            case "apppageurl":
                                attrValue = this._buildProductURL(item);
                                break;
                            case "averagerating":
                                attrValue = this._buildRatingValue(item);
                                break;
                            case "apppricingtext":
                                attrValue = this._buildPricingText(item);
                                break;
                            default:
                                attrValue = item[attr.apiKey];
                        }
                        renderTmp[attr.renderKey] = attrValue;
                    });
                    return renderTmp;
                });
            };

            this._buildRatingValue = (item) => {
                const averageRatingValue = item[this.CONFIG.cardConfig.renderAttributes.find((attr) => attr.renderKey == "averageRating").apiKey];
                return !!averageRatingValue ? averageRatingValue.toFixed(1) : "";
            };

            this._buildPricingText = (item) => {
                let defaultPricingLabel = this.STRINGS.LEARN_MORE;

                if (!item.pricingTypes || item.pricingTypes.length === 0) {
                    return defaultPricingLabel;
                }
                
                if (this.MAPS.pricingTextVariants.some(text => item.pricingTypes.includes(text))) {
                    defaultPricingLabel = this.STRINGS.FREE;
                }
                return defaultPricingLabel;
            };

            this._evaluateCardTmpl = (cardObj) => {
                const keys = Object.keys(cardObj);
                let $evaluatedTmpl = $(this.CONFIG.cardTmpl);

                // modify the template by removing the elements for which the card object does not have a valid value.
                keys.forEach((key) => {
                    const keyValue = cardObj[key];

                    if (!keyValue || keyValue == "" || keyValue.length == 0 ){
                        $evaluatedTmpl.find(`[data-elementmarker="${key}"]`).remove();
                    } else if (key == "appIcon") {
                        $evaluatedTmpl.find("img").prop("src", keyValue);
                    } else if (key == "appPageURL") {
                        $evaluatedTmpl.find("a[data-elementmarker=appPageURL]").attr("href", keyValue);
                    }
                });

                // populate the modified template with the values from card object.
                let evaluatedTmpl = $evaluatedTmpl.prop("outerHTML");
                keys.forEach((key) => {
                    evaluatedTmpl = evaluatedTmpl.replaceAll(`(#=${key}#)`, cardObj[key] || "");
                });

                return evaluatedTmpl;
            };

            this._renderCardItems = (rendererObject) => {
                return rendererObject
                    .map((item) => {
                        return this._evaluateCardTmpl(item);
                    })
                    .join(" ");
            };

            this._renderCardCarousel = (wrapper, rendererObject) => {
                const numberOfCardsInGrid = this.CONFIG.cardConfig.numberOfCardsInGrid;
                const numOfSlides = Math.ceil(rendererObject.length / numberOfCardsInGrid);
                const controlBtns = $(wrapper).find(`${this.SELECTORS.nextBtn},${this.SELECTORS.prevBtn}`);
                let cardGridMarkup = [];
                for (let i=0; i<numOfSlides; i++) {
                    cardGridMarkup.push(`
                        <section id="slide_${i}" class="carousel__slide layout__col layout-item ${i == 0 ? 'active' : '' }" tabindex="0" aria-label="Slide ${i + 1} of ${numOfSlides}">
                            <div class="card-grid__cards">
                                <div class="layout layout--cols-3">${this._renderCardItems(rendererObject.slice(i * numberOfCardsInGrid, (i+1) * numberOfCardsInGrid))}</div>
                            </div>
                        </section>
                    `);
                }
                if(numOfSlides <= 1){
                    controlBtns.addClass('d-none');
                }else{
                    controlBtns.removeClass('d-none');
                }
                $(wrapper).find(this.SELECTORS.carouselCardsContainer).html(cardGridMarkup.join(""));
                this._initializeMWFCarousel(wrapper);
                this._initializeMWFClickGroup(wrapper);
            };

            this._renderCardGrid = (wrapper, rendererObject) => {
                $(wrapper).find(this.SELECTORS.gridCardsContainer).html(this._renderCardItems(rendererObject));
                this._initializeMWFClickGroup(wrapper);
            };

            this._initializeMWFCarousel = (wrapper) => {
                // find and remove any existing carousel instance with the same compid
                this.MAPS.allSnapCarousels = window.ocrReimagine.ScrollSnapCarousel.getInstances();
                const instanceToRemove = this.MAPS.allSnapCarousels.find((instance) => instance.carouselWindow.dataset.compid == this.CONFIG.compId);
                instanceToRemove?.remove();

                // creates a new instance of carousel and the code above takes care of avoiding duplication
                this.Carousel = new window.ocrReimagine.ScrollSnapCarousel({
                    el: wrapper.querySelector(this.SELECTORS.carousel),
                });
            };

            this._initializeMWFClickGroup = (wrapper) => {
                this.ELEMENTS.cgElements = [];
                wrapper.querySelectorAll(`[data-mount="click-group"]`).forEach((cgEl) => {
                    this.ELEMENTS.cgElements.push(new mwf.ClickGroup({
                        el: cgEl
                    }));
                });
            };

            this._updateLocale = () => {
                const [pageLang, pageRegion] = this.CONFIG.locale.split("-");
                this.CONFIG.cardConfig.endpointPayload.data.Language = pageLang;
            };

            this._getEnvUrl = () => {
                return this.CONFIG.apiEndpoint;  
            }

            this._isFilterApplicable = () => {
                const urlParams = this._readURLParams();
                return (this.CONFIG.cardConfig.applicableFilters.includes(urlParams.filterTab));
            };

            this._isAnyFilterSelected = () => {
                const urlParams = this._readURLParams();
                const keys = Object.keys(urlParams);

                return keys.some((key) => {
                    return (key != 'filterTab' && urlParams[key] != "")
                });    
            };

            this._sortObject = (object) => {
                return Object.keys(object)
                    .sort()
                    .reduce((acc, key) => ({
                            ...acc,
                            [key]: object[key],
                        }), {});
            };

            this._isPayloadUpdated = () => {                
                return (
                    JSON.stringify(this._sortObject(this.CONFIG.payloadProxy)) !==
                    JSON.stringify(this._sortObject(this.CONFIG.cardConfig.endpointPayload.data))
                );
            };
            this._checkSendHeaders = (wrapper) => {return $(wrapper).data("isenvppe") == true;};

            this._shouldRenderCarousel = () => {
                return (this.MAPS.cardGridType[this.CONFIG.cardConfig.carouselType] == this.STRINGS.CAROUSEL);
            }

            this._toggleSpinner = (show) => {
                if (this.CONFIG.spinnerElement) {
                    this.CONFIG.spinnerElement.classList.toggle('d-none', !show);
                }
            };

            this._beginCardRender = (wrapper, carouselCardsParam) => {
                this._toggleSpinner(true);
                if (!this._isFilterApplicable() && this._isAnyFilterSelected()) {
                    this._toggleSpinner(false);
                } else {
                    this._buildPayloadData(wrapper, carouselCardsParam);
                    this._updateSeeAllURL();
                
                    const payload = {...this.CONFIG.cardConfig.endpointPayload.data};
                    this.CONFIG.payloadProxy = {...payload};

                    let headers = {};
                    const sendHeaders = this._checkSendHeaders(wrapper);
                    if (!!this.CONFIG.cardConfig.endpointPayload.checkEnv) {
                        headers = (!!sendHeaders) ? {...this.CONFIG.cardConfig.endpointPayload.headers} : {};
                    } else {
                        headers = {...this.CONFIG.cardConfig.endpointPayload.headers}
                    }

                    const envUrl = this._getEnvUrl(wrapper);
                    
                    const request = $.ajax({
                        url: envUrl,
                        data: this.CONFIG.cardConfig.endpointPayload.data,
                        headers: headers,
                    });

                    request
                        .done((response) => {
                            if (response && response[this.CONFIG.cardConfig.resultsObject].length > 0) {
                                const rendererObject = this._buildRenderObject(response);
                                if (!this._shouldRenderCarousel()) {
                                    this._renderCardGrid(wrapper, rendererObject);
                                } else {
                                    this._renderCardCarousel(wrapper, rendererObject);
                                }
                            } 
                            this._toggleSpinner(false);
                        })
                        .fail(() => { 
                            this._toggleSpinner(false);
                        })
                        .always(() => { });
                }
            };

            this._init = (wrapper) => {
                this._setupElements(wrapper);
                this._updateSeeAllURL();
                !this._shouldRenderCarousel() && this._beginCardRender(wrapper);
                
            };

            this.wrapper = opts.element;
            this._init(this.wrapper);
        }

        init() {
            this._init();
        }
    }
}
// Stores all the Card carousel instances
CardGridCarouselInstances = [];



carouselConfig = [
    {
        carouselType: "appSourceMostViewed",
        
        requiredURLParams: [
            {
                urlKey: "filterTab",
                apiKey: "filterTab",
            },
            {
                tabKey: "categories",
                urlKey: "categories",
                apiKey: "categories",
                pdpKey: "category"
            },
            {
                tabKey: "industries",
                urlKey: "industries",
                apiKey: "industries",
                pdpKey: "industry"
            },
            {
                tabKey: "products",
                urlKey: "product",
                apiKey: "productTypes",
                pdpKey: "product"
            },
        ],
        tmplDOMSelector: "#appSourceCardStyleTmpl",
        endpointPayload: {
            data: {
                language: "en",
                gallery: "AppsourceApps",
                market: "ALL",
                orderBy: "Popularity desc",
                publishingStage: "Public",
                select: "uniqueProductId,displayName,smallIconUri,summary,ratingAverage,ratingCount,longSummary,productType,publisherDisplayName,pricingTypes",
                top: "15",
            },
            headers: {
                "x-api-key": "685bc61b5e081ee301e403f1396258c9c0177744361c23870d0f30c21ef48301",    
                "x-ms-app": "appsource"
            },
            checkEnv: false,
            isFilterable: true,
        },
        renderAttributes: [
            { renderKey: "id", apiKey: "uniqueProductId" },
            { renderKey: "appTitle", apiKey: "displayName" },
            { renderKey: "averageRating", apiKey: "ratingAverage" },
            { renderKey: "ratingCount", apiKey: "ratingCount" },
            { renderKey: "appDesc", apiKey: "longSummary" },
            { renderKey: "appType", apiKey: "productType" },
            { renderKey: "appId", apiKey: "uniqueProductId" },
            { renderKey: "appIcon", apiKey: "smallIconUri" },
            { renderKey: "appPageURL", apiKey: "" },
            { renderKey: "appDisplayName", apiKey: "publisherDisplayName" },
            { renderKey: "appPricingText", apiKey: "pricingTypes" },
            { renderKey: "appCategory", apiKey: "category" },
        ],
        resultsObject: "results",
        applicableFilters: ["categories", "industries", "products"],
        numberOfCardsInGrid: 6,
    },
    {
        carouselType: "appSourceNewApps",
        
        requiredURLParams: [
            {
                urlKey: "filterTab",
                apiKey: "filterTab",
            },
            {
                tabKey: "categories",
                urlKey: "categories",
                apiKey: "categories",
                pdpKey: "category"
            },
            {
                tabKey: "industries",
                urlKey: "industries",
                apiKey: "industries",
                pdpKey: "industry"
            },
            {
                tabKey: "products",
                urlKey: "product",
                apiKey: "productTypes",
                pdpKey: "product"
            },
        ],
        tmplDOMSelector: "#appSourceCardStyleTmpl",
        endpointPayload: {
            data: {
                language: "en",
                gallery: "AppsourceApps",
                market: "ALL",
                orderBy: "LastModifiedDateTime desc",
                publishingStage: "Public",
                select: "uniqueProductId,displayName,smallIconUri,summary,longSummary,productType,publisherDisplayName,pricingTypes",
                top: "6",
            },
            headers: {
                "x-api-key": "685bc61b5e081ee301e403f1396258c9c0177744361c23870d0f30c21ef48301",    
                "x-ms-app": "appsource"
            },
            checkEnv: false,
            isFilterable: false,
        },
        renderAttributes: [
            { renderKey: "id", apiKey: "uniqueProductId" },
            { renderKey: "appTitle", apiKey: "displayName" },
            { renderKey: "appDesc", apiKey: "longSummary" },
            { renderKey: "appType", apiKey: "productType" },
            { renderKey: "appId", apiKey: "uniqueProductId" },
            { renderKey: "appIcon", apiKey: "smallIconUri" },
            { renderKey: "appPageURL", apiKey: "" },
            { renderKey: "appDisplayName", apiKey: "publisherDisplayName" },
            { renderKey: "appPricingText", apiKey: "pricingTypes" },
            { renderKey: "appCategory", apiKey: "category" },
            
        ],
        resultsObject: "results",
        applicableFilters: ["categories", "industries", "products"],
        numberOfCardsInGrid: 6,
    },
    {
        carouselType: "appSourceTrendingApps",
        
        requiredURLParams: [
            {
                urlKey: "filterTab",
                apiKey: "filterTab",
            },
            {
                tabKey: "categories",
                urlKey: "categories",
                apiKey: "categories",
                pdpKey: "category"
            },
            {
                tabKey: "industries",
                urlKey: "industries",
                apiKey: "industries",
                pdpKey: "industry"
            },
            {
                tabKey: "products",
                urlKey: "product",
                apiKey: "productTypes",
                pdpKey: "product"
            },
        ],
        tmplDOMSelector: "#appSourceCardStyleTmpl",
        endpointPayload: {
            data: {
                language: "en",
                gallery: "AppsourceApps",
                market: "ALL",
                orderBy: "LastModifiedDateTime desc",
                publishingStage: "Public",
                select: "uniqueProductId,displayName,smallIconUri,summary,longSummary,productType,publisherDisplayName,pricingTypes",
                top: "6",
            },
            headers: {
                "x-api-key": "685bc61b5e081ee301e403f1396258c9c0177744361c23870d0f30c21ef48301",    
                "x-ms-app": "appsource"
            },
            checkEnv: false,
            isFilterable: false,
        },
        renderAttributes: [
            { renderKey: "id", apiKey: "uniqueProductId" },
            { renderKey: "appTitle", apiKey: "displayName" },
            { renderKey: "appDesc", apiKey: "longSummary" },
            { renderKey: "appType", apiKey: "productType" },
            { renderKey: "appId", apiKey: "uniqueProductId" },
            { renderKey: "appIcon", apiKey: "smallIconUri" },
            { renderKey: "appPageURL", apiKey: "" },
            { renderKey: "appDisplayName", apiKey: "publisherDisplayName" },
            { renderKey: "appPricingText", apiKey: "pricingTypes" },
            { renderKey: "appCategory", apiKey: "category" },
            
        ],
        resultsObject: "results",
        applicableFilters: ["categories", "industries", "products"],
        numberOfCardsInGrid: 6,
    },
]
if(!window.appsource) {
    window.appsource = {};
}

if(!window.appsource.tabFiltersMap) {
    window.appsource.tabFiltersMap = [
    {
        tabKey: "categories",
        filterLabel: "AI + Machine Learning",
        urlKey: "ai-machine-learning",
        apiKey: "ai-plus-machine-learning",
    },
    {
        tabKey: "categories",
        filterLabel: "Analytics",
        urlKey: "analytics",
        apiKey: "big-data",
    },
    {
        tabKey: "categories",
        filterLabel: "Collaboration",
        urlKey: "collaboration",
        apiKey: "chat",
    },
    {
        tabKey: "categories",
        filterLabel: "Commerce",
        urlKey: "commerce",
        apiKey: "e-commerce",
    },
    {
        tabKey: "categories",
        filterLabel: "Compliance & Legal",
        urlKey: "compliance-legals",
        apiKey: "data-governance-and-privacy",
    },
    {
        tabKey: "categories",
        filterLabel: "Customer Service",
        urlKey: "customer-service",
        apiKey: "back-office-and-employee-service",
    },
    {
        tabKey: "categories",
        filterLabel: "Finance",
        urlKey: "finance",
        apiKey: "accounting",
    },
    {
        tabKey: "categories",
        filterLabel: "Geolocation",
        urlKey: "geolocation",
        apiKey: "address-validation",
    },
    {
        tabKey: "categories",
        filterLabel: "Human Resources",
        urlKey: "human-resources",
        apiKey: "hr-operations",
    },
    {
        tabKey: "categories",
        filterLabel: "Internet of Things",
        urlKey: "internet-of-things",
        apiKey: "data-analytics-and-visualization",
    },
    {
        tabKey: "categories",
        filterLabel: "IT & Management Tools",
        urlKey: "it-management-tools",
        apiKey: "business-applications",
    },
    {
        tabKey: "categories",
        filterLabel: "Marketing",
        urlKey: "marketing",
        apiKey: "advertisement",
    },
    {
        tabKey: "categories",
        filterLabel: "Operations & Supply Chain",
        urlKey: "operations",
        apiKey: "asset-and-production-management",
    },
    {
        tabKey: "categories",
        filterLabel: "Productivity",
        urlKey: "productivity",
        apiKey: "blogs",
    },
    {
        tabKey: "categories",
        filterLabel: "Project Management",
        urlKey: "project-management",
        apiKey: "project-accounting-revenue-recognition",
    },
    {
        tabKey: "categories",
        filterLabel: "Sales",
        urlKey: "sales",
        apiKey: "business-data-enrichment",
    },
    {
        tabKey: "industries",
        filterLabel: "Automotive",
        urlKey: "automotive",
        apiKey: "Automotive_AS",
    },
    {
        tabKey: "industries",
        filterLabel: "Defense & Intelligence",
        urlKey: "defense-and-intelligence",
        apiKey: "DefenseIntelligence_AS_L1",
    },
    {
        tabKey: "industries",
        filterLabel: "Distribution",
        urlKey: "distribution",
        apiKey: "Distribution",
    },
    {
        tabKey: "industries",
        filterLabel: "Education",
        urlKey: "education",
        apiKey: "Education",
    },
    {
        tabKey: "industries",
        filterLabel: "Energy & Resources",
        urlKey: "energy",
        apiKey: "Energy_AS_L1",
    },
    {
        tabKey: "industries",
        filterLabel: "Financial Services",
        urlKey: "financial-services",
        apiKey: "FinancialServices",
    },
    {
        tabKey: "industries",
        filterLabel: "Government",
        urlKey: "government",
        apiKey: "Government",
    },
    {
        tabKey: "industries",
        filterLabel: "Healthcare",
        urlKey: "healthcare",
        apiKey: "HealthCareandLifeSciences",
    },
    {
        tabKey: "industries",
        filterLabel: "Hospitality & Travel",
        urlKey: "hospitality-and-travel",
        apiKey: "HospitalityTravel_AS",
    },
    {
        tabKey: "industries",
        filterLabel: "Industrials & Manufacturing",
        urlKey: "manufacturing-resources",
        apiKey: "manufacturing-resources",
    },
    {
        tabKey: "industries",
        filterLabel: "Nonprofit & IGO",
        urlKey: "nonprofit",
        apiKey: "NonprofitIGO_AS_L1",
    },
    {
        tabKey: "industries",
        filterLabel: "Professional Services",
        urlKey: "professional-services",
        apiKey: "ProfessionalServices",
    },
    {
        tabKey: "industries",
        filterLabel: "Retail & Consumer Goods",
        urlKey: "retail-and-consumer-goods",
        apiKey: "RetailandConsumerGoods",
    },
    {
        tabKey: "industries",
        filterLabel: "Sustainability",
        urlKey: "sustainability",
        apiKey: "Sustainability_AS",
    },
    {
        tabKey: "industries",
        filterLabel: "Telecommunications & Media",
        urlKey: "media-communications",
        apiKey: "MediaCommunications_AS",
    },
    {
        tabKey: "products",
        filterLabel: "Dynamics 365",
        urlKey: "dynamics-365",
        apiKey: "DynamicsBC,DynamicsCE,DynamicsOps",
    },
    {
        tabKey: "products",
        filterLabel: "Microsoft 365",
        urlKey: "office",
        apiKey: "Office365",
    },
    {
        tabKey: "products",
        filterLabel: "Power Platform",
        urlKey: "power-platform",
        apiKey: "PowerBiVisuals,PowerBI",
    },
    {
        tabKey: "products",
        filterLabel: "SaaS",
        urlKey: "web-apps",
        apiKey: "SaaS",
    },
];
}

if(!window.appsource.productTypeMap) {
window.appsource.productTypeMap = [
    {
        offerType: "SaaS",
        urlKey: "web-apps",
    },
    {
        offerType: "DynamicsOps",
        urlKey: "dynamics-365-for-operations",
    },
    {
        offerType: "DynamicsBC",
        urlKey: "dynamics-365-business-central",
    },
    {
        offerType: "DynamicsCE",
        urlKey: "dynamics-365",
    },
    {
        offerType: "PowerBI",
        urlKey: "power-bi",
    },
    {
        offerType: "PowerBiVisuals",
        urlKey: "power-bi-visuals",
    },
    {
        offerType: "Office365",
        urlKey: "office",
    },
];
}


