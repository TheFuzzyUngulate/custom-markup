import { Parser } from './parse.js'

// this is where all the active listeners in the DOM are added.
// it's not as great as having them 

function buttonToggleAsideView(ev) {
    const btn = ev.target;
    const asideSeg = btn.closest('.aside-segment');
    const aside = asideSeg.querySelector('.aside-content');

    if (aside.classList.contains('expanded')) {
        const main = asideSeg.parentNode.querySelector('.main-content');
        const mainHeight = main.scrollHeight;
        const btnStyle = window.getComputedStyle(btn);
        const btnHeight = btnStyle.getPropertyValue('line-height');
        aside.style.maxHeight = `calc(${mainHeight}px - ${btnHeight})`;
        aside.classList.remove('expanded');
        btn.innerText = 'more...';
    } else {
        const asideHeight = aside.scrollHeight;
        aside.style.maxHeight = asideHeight + 'px';
        aside.classList.add('expanded');
        btn.innerText = '...less';
    }
}

function asideTruncateIfOverflow(aside) {
    const seg  = aside.parentNode;
    const main = seg.parentNode.querySelector('.main-content');

    const btn = seg.querySelector('.aside-btn');
    const mainHeight = main.scrollHeight;
    const asideHeight = aside.scrollHeight;

    aside.style.maxHeight = asideHeight + 'px';
    aside.classList.remove('truncated');

    if (mainHeight < asideHeight) {
        const btnStyle = window.getComputedStyle(btn);
        const btnHeight = btnStyle.getPropertyValue('line-height');

        if (!aside.classList.contains('expanded')) {
            aside.style.maxHeight = 
                `calc(${mainHeight}px - ${btnHeight})`;
        }

        aside.classList.add('truncated');
        btn.classList.add('aside-btn-visible');
    }
}

function handleAsideHeight(element) {
    if (typeof handleAsideHeight.obs === 'undefined') {
        handleAsideHeight.obs = new ResizeObserver(entries => {
            for (let entry of entries) {
                asideTruncateIfOverflow(entry.target);
            }
        });
    }

    handleAsideHeight.obs.observe(element);
}

function handleAsideBtnToggle(element) {
    element.addEventListener('click', buttonToggleAsideView);
}

function handleSelectLinkage(element, refKeys) {
    const info = element.id.split('_');
    const key = info[1];

    if (key in refKeys) {
        let values = refKeys[key].values;
        if (values.length > 0) {
            element.href = `#${values[0]}`;
        }
    }
}

function applyOpsInTemplate(template, refKeys)
{
    var ml_root   = template.content.children[0];
    var hasAsides = false;
    var current   = undefined;
    var walker    = document.createTreeWalker(
        ml_root, 
        NodeFilter.SHOW_ELEMENT
    );
    var observer  = new ResizeObserver(entries => {
        for (let entry of entries) {
            asideTruncateIfOverflow(entry.target);
        }
    });

    while ((current = walker.nextNode()) !== null) {
        if (current.classList.contains('aside-btn')) {
            handleAsideBtnToggle(current);
        } else if (current.classList.contains('aside-content')) {
            hasAsides = true;
            observer.observe(current);
        } else if (current.classList.contains('pSel')) {
            handleSelectLinkage(current, refKeys);
        }
    }

    if (hasAsides) {
        ml_root.classList.add('show-asides');
    }
}

export function parseAndFill(text, dest) {
    const template = document.createElement("template");
    const markupParse = new Parser(text);
    
    const str = markupParse.doc();
    template.innerHTML = str;
    applyOpsInTemplate(template, markupParse.refKeys);
    dest.replaceChildren(template.content);
}