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

function asideTruncateIfOverflow(asideSeg) {
    const main = asideSeg.parentNode.querySelector('.main-content');
    const aside = asideSeg.querySelector('.aside-content');
    if (!aside) return;

    const btn = asideSeg.querySelector('.aside-btn');
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

function applyOpsInTemplate(template) {
    for (let e of template.content.children) {
        let curr, walker;

        walker = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT);
        while ((curr = walker.nextNode()) !== null) {
            if (curr.classList.contains('aside-btn')) {
                handleAsideBtnToggle(curr);
            } else if (curr.classList.contains('aside-segment')) {
                handleAsideHeight(curr);
            }
        }
    }
}

export function parseAndFill(text, dest) {
    const template = document.createElement("template");
    const markupParse = new Parser(text);
    
    const str = markupParse.doc();
    template.innerHTML = str;
    applyOpsInTemplate(template);
    dest.replaceChildren(template.content);
}