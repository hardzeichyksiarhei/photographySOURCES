//Common plugin style
import 'photoswipe/dist/photoswipe.css';
import 'photoswipe/dist/default-skin/default-skin.css';
import 'justifiedGallery/dist/css/justifiedGallery.css'

import './about-me.sass';

//Common plugin scripts
import PhotoSwipe from 'photoswipe';
import PhotoSwipeUI_Default from 'photoswipe/dist/photoswipe-ui-default';
import 'justifiedGallery/dist/js/jquery.justifiedGallery';

$(function () {

    //---------------- Plugins -----------------
    //------------------------------------------

    $('#my-photo-grid').justifiedGallery({
        rowHeight: 320,
        margins: 10
    });

    addContainerPhotoSwipeDOM();

    initPhotoSwipeFromDOM('.gallery');

    //------------------------------------------
    //------------------------------------------



    //---------------- Methods -----------------
    //------------------------------------------

    function addContainerPhotoSwipeDOM() {
        $('body').append('<div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">' +
            '    <div class="pswp__bg"></div>' +
            '    <!-- Slides wrapper with overflow:hidden. -->' +
            '    <div class="pswp__scroll-wrap">' +
            '        <div class="pswp__container">' +
            '            <div class="pswp__item"></div>' +
            '            <div class="pswp__item"></div>' +
            '            <div class="pswp__item"></div>' +
            '        </div>' +
            '        <div class="pswp__ui pswp__ui--hidden">' +
            '            <div class="pswp__top-bar">' +
            '                <div class="pswp__counter"></div>' +
            '                <button class="pswp__button pswp__button--close" title="Close (Esc)"></button>' +
            '                <button class="pswp__button pswp__button--share" title="Share"></button>' +
            '                <button class="pswp__button pswp__button--fs" title="Toggle fullscreen"></button>' +
            '                <button class="pswp__button pswp__button--zoom" title="Zoom in/out"></button>' +
            '                <div class="pswp__preloader">' +
            '                    <div class="pswp__preloader__icn">' +
            '                      <div class="pswp__preloader__cut">' +
            '                        <div class="pswp__preloader__donut"></div>' +
            '                      </div>' +
            '                    </div>' +
            '                </div>' +
            '            </div>' +
            '            <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">' +
            '                <div class="pswp__share-tooltip"></div> ' +
            '            </div>' +
            '            <button class="pswp__button pswp__button--arrow--left" title="Previous (arrow left)">' +
            '            </button>' +
            '            <button class="pswp__button pswp__button--arrow--right" title="Next (arrow right)">' +
            '            </button>' +
            '            <div class="pswp__caption">' +
            '                <div class="pswp__caption__center"></div>' +
            '            </div>' +
            '        </div>' +
            '    </div>' +
            '</div>');
    }

    function initPhotoSwipeFromDOM(gallerySelector) {

        // parse slide data (url, title, size ...) from DOM elements
        // (children of gallerySelector)
        let parseThumbnailElements = function (el) {
            let thumbElements = el.childNodes,
                numNodes = thumbElements.length,
                items = [],
                workGridItemEl,
                linkEl,
                imgEl,
                item;

            for (let i = 0; i < numNodes; i++) {

                workGridItemEl = thumbElements[i]; // <gallery__item> element

                // include only element nodes
                if (workGridItemEl.nodeType !== 1 || workGridItemEl.className === 'spinner') {
                    continue;
                }

                imgEl = workGridItemEl.getElementsByClassName('gallery__img')[0]; // <img> element

                linkEl = workGridItemEl.getElementsByClassName('gallery__link')[0]; // <a> element

                item = {
                    src: linkEl.getAttribute('href'),
                    w: parseInt(imgEl.naturalWidth, 10),
                    h: parseInt(imgEl.naturalHeight, 10)
                };

                if (workGridItemEl.children.length > 0) {
                    item.msrc = imgEl.getAttribute('src'); // <img> thumbnail element, retrieving thumbnail url
                }

                item.el = workGridItemEl; // save link to element for getThumbBoundsFn
                items.push(item);
            }

            return items;
        };

        // find nearest parent element
        let closest = function closest(el, fn) {
            return el && ( fn(el) ? el : closest(el.parentNode, fn) );
        };

        let hasClass = function (element, cls) {
            return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
        };

        // triggers when user clicks on thumbnail
        let onThumbnailsClick = function (e) {

            e = e || window.event;
            e.preventDefault ? e.preventDefault() : e.returnValue = false;

            let eTarget = e.target || e.srcElement;

            // find root element of slide
            let clickedListItem = closest(eTarget, function (el) {
                return hasClass(el, 'gallery__item');
            });

            if (!clickedListItem) {
                return;
            }

            // find index of clicked item by looping through all child nodes
            // alternatively, you may define index via data- attribute
            let clickedGallery = clickedListItem.parentNode,
                childNodes = clickedListItem.parentNode.childNodes,
                numChildNodes = childNodes.length,
                nodeIndex = 0,
                index;

            for (let i = 0; i < numChildNodes; i++) {
                if (childNodes[i].nodeType !== 1) {
                    continue;
                }

                if (childNodes[i] === clickedListItem) {
                    index = nodeIndex;
                    break;
                }
                nodeIndex++;
            }

            if (index >= 0) {
                // open PhotoSwipe if valid index found
                openPhotoSwipe(index, clickedGallery);
            }
            return false;
        };

        // parse picture index and gallery index from URL (#&pid=1&gid=2)
        let photoswipeParseHash = function () {
            let hash = window.location.hash.substring(1),
                params = {};

            if (hash.length < 5) {
                return params;
            }

            let vars = hash.split('&');
            for (let i = 0; i < vars.length; i++) {
                if (!vars[i]) {
                    continue;
                }
                let pair = vars[i].split('=');
                if (pair.length < 2) {
                    continue;
                }
                params[pair[0]] = pair[1];
            }

            if (params.gid) {
                params.gid = parseInt(params.gid, 10);
            }

            return params;
        };

        let openPhotoSwipe = function (index, galleryElement, disableAnimation, fromURL) {
            let pswpElement = document.querySelectorAll('.pswp')[0],
                gallery,
                options,
                items;

            items = parseThumbnailElements(galleryElement);

            // define options (if needed)
            options = {

                // define gallery index (for URL)
                galleryUID: galleryElement.getAttribute('data-pswp-uid'),

                getThumbBoundsFn: function (index) {
                    // See Options -> getThumbBoundsFn section of documentation for more info
                    let thumbnail = items[index].el.getElementsByTagName('img')[0], // find thumbnail
                        pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                        rect = thumbnail.getBoundingClientRect();

                    return {x: rect.left, y: rect.top + pageYScroll, w: rect.width};
                }

            };

            // PhotoSwipe opened from URL
            if (fromURL) {
                if (options.galleryPIDs) {
                    // parse real index when custom PIDs are used
                    // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
                    for (let j = 0; j < items.length; j++) {
                        if (items[j].pid === index) {
                            options.index = j;
                            break;
                        }
                    }
                } else {
                    // in URL indexes start from 1
                    options.index = parseInt(index, 10) - 1;
                }
            } else {
                options.index = parseInt(index, 10);
            }

            // exit if index not found
            if (isNaN(options.index)) {
                return;
            }

            if (disableAnimation) {
                options.showAnimationDuration = 0;
            }

            // Pass data to PhotoSwipe and initialize it
            gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
            gallery.init();
        };

        // loop through all gallery elements and bind events
        let galleryElements = document.querySelectorAll(gallerySelector);

        for (let i = 0, l = galleryElements.length; i < l; i++) {
            galleryElements[i].setAttribute('data-pswp-uid', i + 1);
            galleryElements[i].onclick = onThumbnailsClick;
        }

        // Parse URL and open gallery if it contains #&pid=3&gid=1
        let hashData = photoswipeParseHash();
        if (hashData.pid && hashData.gid) {
            openPhotoSwipe(hashData.pid, galleryElements[hashData.gid - 1], true, true);
        }
    }

    //------------------------------------------
    //------------------------------------------

});