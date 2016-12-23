
export function assert (condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function el(selector) {
  return childEl(document, selector);
}

export function childEl(parentElement, selector) {
  const elements = parentElement.querySelectorAll(selector);
  if (elements.length === 0) {
    return null;
  }
  if (elements.length === 1) {
    return elements[0];
  }
  return elements;
}

export function toggleClass(element, className) {
  let classList = element.classList;

  if (classList.contains(className)) {
    classList.remove(className);
  } else {
    classList.add(className);
  }
}

export function isString (input) {
  return typeof input === 'string' || input instanceof String;
}
