'use strict';function getSkuMarkup(a,c){let b=a.discountedTextTemplate;a.isDiscounted&&b&&(b=b.replace(window.ocReimagine.ProductPriceModule.ProductPricingConstants.Parameters.ScreenReader.ListPriceKey,c.sku.displayListPrice),b=b.replace(window.ocReimagine.ProductPriceModule.ProductPricingConstants.Parameters.ScreenReader.MsrpKey,c.sku.displayMSRPPrice));const d=`
        <div 
            class="sku__pricing-discount">
            <span class="oc-displayMSRPPrice">${c.sku.displayMSRPPrice}</span>
        </div>
    `,e=`
        <div class="sku__detail-recurrence">
            <span class="oc-displayUnit">${a.displayUnitMap[c.productId]}
            </span>
        </div>
    `;return`
        <div class="sku__title" data-ocr-pricing-render="title">
            <h3 class="oc-product-title">${a.renderTitle}</h3>
        </div>
        <div class="sku__paragraph" data-ocr-pricing-content="paragraph"></div>
        ${a.isDiscounted?`
        <p class="sr-only" data-ocr-pricing-render="screen-reader">
            ${b}
        </p>
    `:""}
        <!-- when there is price discount, the screen reader will announce the dispalyListPrice twice, then we need to set aria-hidden='true' here for this scenario -->
        <div class="sku__pricing" data-ocr-pricing-render="pricing" aria-hidden=${b&&a.isDiscounted?"true":""}>
            ${a.isDiscounted?d:""}
            <div class="sku__pricing-current">
                <span class="oc-displayListPrice">${c.sku.displayListPrice}</span>
            </div>
        </div>
        ${a.displayUnitMap[c.productId]?e:""}
        <div class="sku__detail-commitment" data-ocr-pricing-content="commitment"></div>
        <div class="sku__note" data-ocr-pricing-content="disclaimer"></div>
        <div class="sku__buttons" data-ocr-pricing-content="links"></div>
        <div class="sku__footnote" data-ocr-pricing-content="footnote"></div>
    `};