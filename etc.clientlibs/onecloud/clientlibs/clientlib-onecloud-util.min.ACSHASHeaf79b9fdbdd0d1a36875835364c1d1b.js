class OneCloudUtil {

  /**
   * Get the API endpoint for the OneCloud Data Connector.
   * @param {string} path - The path to append to the API endpoint.
   * @param {string} querystring - The query string to add to the API endpoint.
   * @returns {string} - The API endpoint with the environment specific query parameters.
   */
  static getMsocapiurl = (path, querystring) => {
    let url = `${OneCloudEnvironmentConstants.DataConnector.endpoint}${path}`;
    let envQueryParamKeys = Object.keys(OneCloudEnvironmentConstants.DataConnector.queryParams);

    // Add passed query string.
    if(querystring && querystring.length > 0) {
      url += `?${querystring}`;
    } else if (envQueryParamKeys.length > 0) {
      url += '?';
    } 

    // Add environment specific query parameters and return.
    return  OneCloudUtil.addEnvironmentSpecificQueryParams(url);;
  }

  /**
   * Add environment specific query parameters to the url.
   * @param {string} url - The url to add the query parameters to.
   * @returns {string} - The url with the environment specific query parameters.
   */
  static addEnvironmentSpecificQueryParams = (url) => {
    let envQueryParamKeys = Object.keys(OneCloudEnvironmentConstants.DataConnector.queryParams);
    envQueryParamKeys.forEach((key) => {
      if(url.indexOf('?') !== -1) url += '&';
      url += `${key}=${OneCloudEnvironmentConstants.DataConnector.queryParams[key]}`;
    });
    return url;
  }

  /**
  * Wait for an element to be available in the DOM, and return a promise that resolves when the element is available.
  * @param {string} selector - The selector for the element to wait for.
  * @param {HTMLElement} containerElement - The container element to search within. Defaults to document.
  * @returns {Promise} - A promise that resolves when the element is available.
  */
  static waitForElement = (selector, containerElement) => {
    containerElement = containerElement || document;
    const elementToObserve = containerElement === document ? document.body : containerElement;

    return new Promise(resolve => {
      if (containerElement.querySelector(selector)) {
        return resolve(containerElement.querySelector(selector));
      }

      const observer = new MutationObserver(() => {
        if (containerElement.querySelector(selector)) {
          observer.disconnect();
          resolve(containerElement.querySelector(selector));
        }
      });

      observer.observe(elementToObserve, {
        childList: true,
        subtree: true
      });
    });
  };
}