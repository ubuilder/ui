(function () {
  'use strict';

  // packages/alpinejs/src/scheduler.js
  var flushPending = false;
  var flushing = false;
  var queue = [];
  var lastFlushedIndex = -1;
  function scheduler(callback) {
    queueJob(callback);
  }
  function queueJob(job) {
    if (!queue.includes(job))
      queue.push(job);
    queueFlush();
  }
  function dequeueJob(job) {
    let index = queue.indexOf(job);
    if (index !== -1 && index > lastFlushedIndex)
      queue.splice(index, 1);
  }
  function queueFlush() {
    if (!flushing && !flushPending) {
      flushPending = true;
      queueMicrotask(flushJobs);
    }
  }
  function flushJobs() {
    flushPending = false;
    flushing = true;
    for (let i = 0; i < queue.length; i++) {
      queue[i]();
      lastFlushedIndex = i;
    }
    queue.length = 0;
    lastFlushedIndex = -1;
    flushing = false;
  }

  // packages/alpinejs/src/reactivity.js
  var reactive;
  var effect;
  var release;
  var raw;
  var shouldSchedule = true;
  function disableEffectScheduling(callback) {
    shouldSchedule = false;
    callback();
    shouldSchedule = true;
  }
  function setReactivityEngine(engine) {
    reactive = engine.reactive;
    release = engine.release;
    effect = (callback) => engine.effect(callback, {scheduler: (task) => {
      if (shouldSchedule) {
        scheduler(task);
      } else {
        task();
      }
    }});
    raw = engine.raw;
  }
  function overrideEffect(override) {
    effect = override;
  }
  function elementBoundEffect(el) {
    let cleanup2 = () => {
    };
    let wrappedEffect = (callback) => {
      let effectReference = effect(callback);
      if (!el._x_effects) {
        el._x_effects = new Set();
        el._x_runEffects = () => {
          el._x_effects.forEach((i) => i());
        };
      }
      el._x_effects.add(effectReference);
      cleanup2 = () => {
        if (effectReference === void 0)
          return;
        el._x_effects.delete(effectReference);
        release(effectReference);
      };
      return effectReference;
    };
    return [wrappedEffect, () => {
      cleanup2();
    }];
  }

  // packages/alpinejs/src/mutation.js
  var onAttributeAddeds = [];
  var onElRemoveds = [];
  var onElAddeds = [];
  function onElAdded(callback) {
    onElAddeds.push(callback);
  }
  function onElRemoved(el, callback) {
    if (typeof callback === "function") {
      if (!el._x_cleanups)
        el._x_cleanups = [];
      el._x_cleanups.push(callback);
    } else {
      callback = el;
      onElRemoveds.push(callback);
    }
  }
  function onAttributesAdded(callback) {
    onAttributeAddeds.push(callback);
  }
  function onAttributeRemoved(el, name, callback) {
    if (!el._x_attributeCleanups)
      el._x_attributeCleanups = {};
    if (!el._x_attributeCleanups[name])
      el._x_attributeCleanups[name] = [];
    el._x_attributeCleanups[name].push(callback);
  }
  function cleanupAttributes(el, names) {
    if (!el._x_attributeCleanups)
      return;
    Object.entries(el._x_attributeCleanups).forEach(([name, value]) => {
      if (names === void 0 || names.includes(name)) {
        value.forEach((i) => i());
        delete el._x_attributeCleanups[name];
      }
    });
  }
  var observer = new MutationObserver(onMutate);
  var currentlyObserving = false;
  function startObservingMutations() {
    observer.observe(document, {subtree: true, childList: true, attributes: true, attributeOldValue: true});
    currentlyObserving = true;
  }
  function stopObservingMutations() {
    flushObserver();
    observer.disconnect();
    currentlyObserving = false;
  }
  var recordQueue = [];
  var willProcessRecordQueue = false;
  function flushObserver() {
    recordQueue = recordQueue.concat(observer.takeRecords());
    if (recordQueue.length && !willProcessRecordQueue) {
      willProcessRecordQueue = true;
      queueMicrotask(() => {
        processRecordQueue();
        willProcessRecordQueue = false;
      });
    }
  }
  function processRecordQueue() {
    onMutate(recordQueue);
    recordQueue.length = 0;
  }
  function mutateDom(callback) {
    if (!currentlyObserving)
      return callback();
    stopObservingMutations();
    let result = callback();
    startObservingMutations();
    return result;
  }
  var isCollecting = false;
  var deferredMutations = [];
  function deferMutations() {
    isCollecting = true;
  }
  function flushAndStopDeferringMutations() {
    isCollecting = false;
    onMutate(deferredMutations);
    deferredMutations = [];
  }
  function onMutate(mutations) {
    if (isCollecting) {
      deferredMutations = deferredMutations.concat(mutations);
      return;
    }
    let addedNodes = [];
    let removedNodes = [];
    let addedAttributes = new Map();
    let removedAttributes = new Map();
    for (let i = 0; i < mutations.length; i++) {
      if (mutations[i].target._x_ignoreMutationObserver)
        continue;
      if (mutations[i].type === "childList") {
        mutations[i].addedNodes.forEach((node) => node.nodeType === 1 && addedNodes.push(node));
        mutations[i].removedNodes.forEach((node) => node.nodeType === 1 && removedNodes.push(node));
      }
      if (mutations[i].type === "attributes") {
        let el = mutations[i].target;
        let name = mutations[i].attributeName;
        let oldValue = mutations[i].oldValue;
        let add2 = () => {
          if (!addedAttributes.has(el))
            addedAttributes.set(el, []);
          addedAttributes.get(el).push({name, value: el.getAttribute(name)});
        };
        let remove = () => {
          if (!removedAttributes.has(el))
            removedAttributes.set(el, []);
          removedAttributes.get(el).push(name);
        };
        if (el.hasAttribute(name) && oldValue === null) {
          add2();
        } else if (el.hasAttribute(name)) {
          remove();
          add2();
        } else {
          remove();
        }
      }
    }
    removedAttributes.forEach((attrs, el) => {
      cleanupAttributes(el, attrs);
    });
    addedAttributes.forEach((attrs, el) => {
      onAttributeAddeds.forEach((i) => i(el, attrs));
    });
    for (let node of removedNodes) {
      if (addedNodes.includes(node))
        continue;
      onElRemoveds.forEach((i) => i(node));
      if (node._x_cleanups) {
        while (node._x_cleanups.length)
          node._x_cleanups.pop()();
      }
    }
    addedNodes.forEach((node) => {
      node._x_ignoreSelf = true;
      node._x_ignore = true;
    });
    for (let node of addedNodes) {
      if (removedNodes.includes(node))
        continue;
      if (!node.isConnected)
        continue;
      delete node._x_ignoreSelf;
      delete node._x_ignore;
      onElAddeds.forEach((i) => i(node));
      node._x_ignore = true;
      node._x_ignoreSelf = true;
    }
    addedNodes.forEach((node) => {
      delete node._x_ignoreSelf;
      delete node._x_ignore;
    });
    addedNodes = null;
    removedNodes = null;
    addedAttributes = null;
    removedAttributes = null;
  }

  // packages/alpinejs/src/scope.js
  function scope(node) {
    return mergeProxies(closestDataStack(node));
  }
  function addScopeToNode(node, data2, referenceNode) {
    node._x_dataStack = [data2, ...closestDataStack(referenceNode || node)];
    return () => {
      node._x_dataStack = node._x_dataStack.filter((i) => i !== data2);
    };
  }
  function closestDataStack(node) {
    if (node._x_dataStack)
      return node._x_dataStack;
    if (typeof ShadowRoot === "function" && node instanceof ShadowRoot) {
      return closestDataStack(node.host);
    }
    if (!node.parentNode) {
      return [];
    }
    return closestDataStack(node.parentNode);
  }
  function mergeProxies(objects) {
    let thisProxy = new Proxy({}, {
      ownKeys: () => {
        return Array.from(new Set(objects.flatMap((i) => Object.keys(i))));
      },
      has: (target, name) => {
        return objects.some((obj) => obj.hasOwnProperty(name));
      },
      get: (target, name) => {
        return (objects.find((obj) => {
          if (obj.hasOwnProperty(name)) {
            let descriptor = Object.getOwnPropertyDescriptor(obj, name);
            if (descriptor.get && descriptor.get._x_alreadyBound || descriptor.set && descriptor.set._x_alreadyBound) {
              return true;
            }
            if ((descriptor.get || descriptor.set) && descriptor.enumerable) {
              let getter = descriptor.get;
              let setter = descriptor.set;
              let property = descriptor;
              getter = getter && getter.bind(thisProxy);
              setter = setter && setter.bind(thisProxy);
              if (getter)
                getter._x_alreadyBound = true;
              if (setter)
                setter._x_alreadyBound = true;
              Object.defineProperty(obj, name, {
                ...property,
                get: getter,
                set: setter
              });
            }
            return true;
          }
          return false;
        }) || {})[name];
      },
      set: (target, name, value) => {
        let closestObjectWithKey = objects.find((obj) => obj.hasOwnProperty(name));
        if (closestObjectWithKey) {
          closestObjectWithKey[name] = value;
        } else {
          objects[objects.length - 1][name] = value;
        }
        return true;
      }
    });
    return thisProxy;
  }

  // packages/alpinejs/src/interceptor.js
  function initInterceptors(data2) {
    let isObject2 = (val) => typeof val === "object" && !Array.isArray(val) && val !== null;
    let recurse = (obj, basePath = "") => {
      Object.entries(Object.getOwnPropertyDescriptors(obj)).forEach(([key, {value, enumerable}]) => {
        if (enumerable === false || value === void 0)
          return;
        let path = basePath === "" ? key : `${basePath}.${key}`;
        if (typeof value === "object" && value !== null && value._x_interceptor) {
          obj[key] = value.initialize(data2, path, key);
        } else {
          if (isObject2(value) && value !== obj && !(value instanceof Element)) {
            recurse(value, path);
          }
        }
      });
    };
    return recurse(data2);
  }
  function interceptor(callback, mutateObj = () => {
  }) {
    let obj = {
      initialValue: void 0,
      _x_interceptor: true,
      initialize(data2, path, key) {
        return callback(this.initialValue, () => get(data2, path), (value) => set(data2, path, value), path, key);
      }
    };
    mutateObj(obj);
    return (initialValue) => {
      if (typeof initialValue === "object" && initialValue !== null && initialValue._x_interceptor) {
        let initialize = obj.initialize.bind(obj);
        obj.initialize = (data2, path, key) => {
          let innerValue = initialValue.initialize(data2, path, key);
          obj.initialValue = innerValue;
          return initialize(data2, path, key);
        };
      } else {
        obj.initialValue = initialValue;
      }
      return obj;
    };
  }
  function get(obj, path) {
    return path.split(".").reduce((carry, segment) => carry[segment], obj);
  }
  function set(obj, path, value) {
    if (typeof path === "string")
      path = path.split(".");
    if (path.length === 1)
      obj[path[0]] = value;
    else if (path.length === 0)
      throw error;
    else {
      if (obj[path[0]])
        return set(obj[path[0]], path.slice(1), value);
      else {
        obj[path[0]] = {};
        return set(obj[path[0]], path.slice(1), value);
      }
    }
  }

  // packages/alpinejs/src/magics.js
  var magics = {};
  function magic(name, callback) {
    magics[name] = callback;
  }
  function injectMagics(obj, el) {
    Object.entries(magics).forEach(([name, callback]) => {
      let memoizedUtilities = null;
      function getUtilities() {
        if (memoizedUtilities) {
          return memoizedUtilities;
        } else {
          let [utilities, cleanup2] = getElementBoundUtilities(el);
          memoizedUtilities = {interceptor, ...utilities};
          onElRemoved(el, cleanup2);
          return memoizedUtilities;
        }
      }
      Object.defineProperty(obj, `$${name}`, {
        get() {
          return callback(el, getUtilities());
        },
        enumerable: false
      });
    });
    return obj;
  }

  // packages/alpinejs/src/utils/error.js
  function tryCatch(el, expression, callback, ...args) {
    try {
      return callback(...args);
    } catch (e) {
      handleError(e, el, expression);
    }
  }
  function handleError(error2, el, expression = void 0) {
    Object.assign(error2, {el, expression});
    console.warn(`Alpine Expression Error: ${error2.message}

${expression ? 'Expression: "' + expression + '"\n\n' : ""}`, el);
    setTimeout(() => {
      throw error2;
    }, 0);
  }

  // packages/alpinejs/src/evaluator.js
  var shouldAutoEvaluateFunctions = true;
  function dontAutoEvaluateFunctions(callback) {
    let cache = shouldAutoEvaluateFunctions;
    shouldAutoEvaluateFunctions = false;
    let result = callback();
    shouldAutoEvaluateFunctions = cache;
    return result;
  }
  function evaluate$1(el, expression, extras = {}) {
    let result;
    evaluateLater(el, expression)((value) => result = value, extras);
    return result;
  }
  function evaluateLater(...args) {
    return theEvaluatorFunction(...args);
  }
  var theEvaluatorFunction = normalEvaluator;
  function setEvaluator(newEvaluator) {
    theEvaluatorFunction = newEvaluator;
  }
  function normalEvaluator(el, expression) {
    let overriddenMagics = {};
    injectMagics(overriddenMagics, el);
    let dataStack = [overriddenMagics, ...closestDataStack(el)];
    let evaluator = typeof expression === "function" ? generateEvaluatorFromFunction(dataStack, expression) : generateEvaluatorFromString(dataStack, expression, el);
    return tryCatch.bind(null, el, expression, evaluator);
  }
  function generateEvaluatorFromFunction(dataStack, func) {
    return (receiver = () => {
    }, {scope: scope2 = {}, params = []} = {}) => {
      let result = func.apply(mergeProxies([scope2, ...dataStack]), params);
      runIfTypeOfFunction(receiver, result);
    };
  }
  var evaluatorMemo = {};
  function generateFunctionFromString(expression, el) {
    if (evaluatorMemo[expression]) {
      return evaluatorMemo[expression];
    }
    let AsyncFunction = Object.getPrototypeOf(async function() {
    }).constructor;
    let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression) || /^(let|const)\s/.test(expression) ? `(async()=>{ ${expression} })()` : expression;
    const safeAsyncFunction = () => {
      try {
        return new AsyncFunction(["__self", "scope"], `with (scope) { __self.result = ${rightSideSafeExpression} }; __self.finished = true; return __self.result;`);
      } catch (error2) {
        handleError(error2, el, expression);
        return Promise.resolve();
      }
    };
    let func = safeAsyncFunction();
    evaluatorMemo[expression] = func;
    return func;
  }
  function generateEvaluatorFromString(dataStack, expression, el) {
    let func = generateFunctionFromString(expression, el);
    return (receiver = () => {
    }, {scope: scope2 = {}, params = []} = {}) => {
      func.result = void 0;
      func.finished = false;
      let completeScope = mergeProxies([scope2, ...dataStack]);
      if (typeof func === "function") {
        let promise = func(func, completeScope).catch((error2) => handleError(error2, el, expression));
        if (func.finished) {
          runIfTypeOfFunction(receiver, func.result, completeScope, params, el);
          func.result = void 0;
        } else {
          promise.then((result) => {
            runIfTypeOfFunction(receiver, result, completeScope, params, el);
          }).catch((error2) => handleError(error2, el, expression)).finally(() => func.result = void 0);
        }
      }
    };
  }
  function runIfTypeOfFunction(receiver, value, scope2, params, el) {
    if (shouldAutoEvaluateFunctions && typeof value === "function") {
      let result = value.apply(scope2, params);
      if (result instanceof Promise) {
        result.then((i) => runIfTypeOfFunction(receiver, i, scope2, params)).catch((error2) => handleError(error2, el, value));
      } else {
        receiver(result);
      }
    } else if (typeof value === "object" && value instanceof Promise) {
      value.then((i) => receiver(i));
    } else {
      receiver(value);
    }
  }

  // packages/alpinejs/src/directives.js
  var prefixAsString = "x-";
  function prefix$1(subject = "") {
    return prefixAsString + subject;
  }
  function setPrefix(newPrefix) {
    prefixAsString = newPrefix;
  }
  var directiveHandlers = {};
  function directive(name, callback) {
    directiveHandlers[name] = callback;
    return {
      before(directive2) {
        if (!directiveHandlers[directive2]) {
          console.warn("Cannot find directive `${directive}`. `${name}` will use the default order of execution");
          return;
        }
        const pos = directiveOrder.indexOf(directive2);
        directiveOrder.splice(pos >= 0 ? pos : directiveOrder.indexOf("DEFAULT"), 0, name);
      }
    };
  }
  function directives(el, attributes, originalAttributeOverride) {
    attributes = Array.from(attributes);
    if (el._x_virtualDirectives) {
      let vAttributes = Object.entries(el._x_virtualDirectives).map(([name, value]) => ({name, value}));
      let staticAttributes = attributesOnly(vAttributes);
      vAttributes = vAttributes.map((attribute) => {
        if (staticAttributes.find((attr) => attr.name === attribute.name)) {
          return {
            name: `x-bind:${attribute.name}`,
            value: `"${attribute.value}"`
          };
        }
        return attribute;
      });
      attributes = attributes.concat(vAttributes);
    }
    let transformedAttributeMap = {};
    let directives2 = attributes.map(toTransformedAttributes((newName, oldName) => transformedAttributeMap[newName] = oldName)).filter(outNonAlpineAttributes).map(toParsedDirectives(transformedAttributeMap, originalAttributeOverride)).sort(byPriority);
    return directives2.map((directive2) => {
      return getDirectiveHandler(el, directive2);
    });
  }
  function attributesOnly(attributes) {
    return Array.from(attributes).map(toTransformedAttributes()).filter((attr) => !outNonAlpineAttributes(attr));
  }
  var isDeferringHandlers = false;
  var directiveHandlerStacks = new Map();
  var currentHandlerStackKey = Symbol();
  function deferHandlingDirectives(callback) {
    isDeferringHandlers = true;
    let key = Symbol();
    currentHandlerStackKey = key;
    directiveHandlerStacks.set(key, []);
    let flushHandlers = () => {
      while (directiveHandlerStacks.get(key).length)
        directiveHandlerStacks.get(key).shift()();
      directiveHandlerStacks.delete(key);
    };
    let stopDeferring = () => {
      isDeferringHandlers = false;
      flushHandlers();
    };
    callback(flushHandlers);
    stopDeferring();
  }
  function getElementBoundUtilities(el) {
    let cleanups = [];
    let cleanup2 = (callback) => cleanups.push(callback);
    let [effect3, cleanupEffect] = elementBoundEffect(el);
    cleanups.push(cleanupEffect);
    let utilities = {
      Alpine: alpine_default,
      effect: effect3,
      cleanup: cleanup2,
      evaluateLater: evaluateLater.bind(evaluateLater, el),
      evaluate: evaluate$1.bind(evaluate$1, el)
    };
    let doCleanup = () => cleanups.forEach((i) => i());
    return [utilities, doCleanup];
  }
  function getDirectiveHandler(el, directive2) {
    let noop = () => {
    };
    let handler4 = directiveHandlers[directive2.type] || noop;
    let [utilities, cleanup2] = getElementBoundUtilities(el);
    onAttributeRemoved(el, directive2.original, cleanup2);
    let fullHandler = () => {
      if (el._x_ignore || el._x_ignoreSelf)
        return;
      handler4.inline && handler4.inline(el, directive2, utilities);
      handler4 = handler4.bind(handler4, el, directive2, utilities);
      isDeferringHandlers ? directiveHandlerStacks.get(currentHandlerStackKey).push(handler4) : handler4();
    };
    fullHandler.runCleanups = cleanup2;
    return fullHandler;
  }
  var startingWith = (subject, replacement) => ({name, value}) => {
    if (name.startsWith(subject))
      name = name.replace(subject, replacement);
    return {name, value};
  };
  var into = (i) => i;
  function toTransformedAttributes(callback = () => {
  }) {
    return ({name, value}) => {
      let {name: newName, value: newValue} = attributeTransformers.reduce((carry, transform) => {
        return transform(carry);
      }, {name, value});
      if (newName !== name)
        callback(newName, name);
      return {name: newName, value: newValue};
    };
  }
  var attributeTransformers = [];
  function mapAttributes(callback) {
    attributeTransformers.push(callback);
  }
  function outNonAlpineAttributes({name}) {
    return alpineAttributeRegex().test(name);
  }
  var alpineAttributeRegex = () => new RegExp(`^${prefixAsString}([^:^.]+)\\b`);
  function toParsedDirectives(transformedAttributeMap, originalAttributeOverride) {
    return ({name, value}) => {
      let typeMatch = name.match(alpineAttributeRegex());
      let valueMatch = name.match(/:([a-zA-Z0-9\-:]+)/);
      let modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
      let original = originalAttributeOverride || transformedAttributeMap[name] || name;
      return {
        type: typeMatch ? typeMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null,
        modifiers: modifiers.map((i) => i.replace(".", "")),
        expression: value,
        original
      };
    };
  }
  var DEFAULT = "DEFAULT";
  var directiveOrder = [
    "ignore",
    "ref",
    "data",
    "id",
    "bind",
    "init",
    "for",
    "model",
    "modelable",
    "transition",
    "show",
    "if",
    DEFAULT,
    "teleport"
  ];
  function byPriority(a, b) {
    let typeA = directiveOrder.indexOf(a.type) === -1 ? DEFAULT : a.type;
    let typeB = directiveOrder.indexOf(b.type) === -1 ? DEFAULT : b.type;
    return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
  }

  // packages/alpinejs/src/utils/dispatch.js
  function dispatch(el, name, detail = {}) {
    el.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true
    }));
  }

  // packages/alpinejs/src/utils/walk.js
  function walk(el, callback) {
    if (typeof ShadowRoot === "function" && el instanceof ShadowRoot) {
      Array.from(el.children).forEach((el2) => walk(el2, callback));
      return;
    }
    let skip = false;
    callback(el, () => skip = true);
    if (skip)
      return;
    let node = el.firstElementChild;
    while (node) {
      walk(node, callback);
      node = node.nextElementSibling;
    }
  }

  // packages/alpinejs/src/utils/warn.js
  function warn(message, ...args) {
    console.warn(`Alpine Warning: ${message}`, ...args);
  }

  // packages/alpinejs/src/lifecycle.js
  var started = false;
  function start() {
    if (started)
      warn("Alpine has already been initialized on this page. Calling Alpine.start() more than once can cause problems.");
    started = true;
    if (!document.body)
      warn("Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine's `<script>` tag?");
    dispatch(document, "alpine:init");
    dispatch(document, "alpine:initializing");
    startObservingMutations();
    onElAdded((el) => initTree(el, walk));
    onElRemoved((el) => destroyTree(el));
    onAttributesAdded((el, attrs) => {
      directives(el, attrs).forEach((handle) => handle());
    });
    let outNestedComponents = (el) => !closestRoot(el.parentElement, true);
    Array.from(document.querySelectorAll(allSelectors())).filter(outNestedComponents).forEach((el) => {
      initTree(el);
    });
    dispatch(document, "alpine:initialized");
  }
  var rootSelectorCallbacks = [];
  var initSelectorCallbacks = [];
  function rootSelectors() {
    return rootSelectorCallbacks.map((fn) => fn());
  }
  function allSelectors() {
    return rootSelectorCallbacks.concat(initSelectorCallbacks).map((fn) => fn());
  }
  function addRootSelector(selectorCallback) {
    rootSelectorCallbacks.push(selectorCallback);
  }
  function addInitSelector(selectorCallback) {
    initSelectorCallbacks.push(selectorCallback);
  }
  function closestRoot(el, includeInitSelectors = false) {
    return findClosest(el, (element) => {
      const selectors = includeInitSelectors ? allSelectors() : rootSelectors();
      if (selectors.some((selector) => element.matches(selector)))
        return true;
    });
  }
  function findClosest(el, callback) {
    if (!el)
      return;
    if (callback(el))
      return el;
    if (el._x_teleportBack)
      el = el._x_teleportBack;
    if (!el.parentElement)
      return;
    return findClosest(el.parentElement, callback);
  }
  function isRoot(el) {
    return rootSelectors().some((selector) => el.matches(selector));
  }
  var initInterceptors2 = [];
  function interceptInit(callback) {
    initInterceptors2.push(callback);
  }
  function initTree(el, walker = walk, intercept = () => {
  }) {
    deferHandlingDirectives(() => {
      walker(el, (el2, skip) => {
        intercept(el2, skip);
        initInterceptors2.forEach((i) => i(el2, skip));
        directives(el2, el2.attributes).forEach((handle) => handle());
        el2._x_ignore && skip();
      });
    });
  }
  function destroyTree(root) {
    walk(root, (el) => cleanupAttributes(el));
  }

  // packages/alpinejs/src/nextTick.js
  var tickStack = [];
  var isHolding = false;
  function nextTick(callback = () => {
  }) {
    queueMicrotask(() => {
      isHolding || setTimeout(() => {
        releaseNextTicks();
      });
    });
    return new Promise((res) => {
      tickStack.push(() => {
        callback();
        res();
      });
    });
  }
  function releaseNextTicks() {
    isHolding = false;
    while (tickStack.length)
      tickStack.shift()();
  }
  function holdNextTicks() {
    isHolding = true;
  }

  // packages/alpinejs/src/utils/classes.js
  function setClasses(el, value) {
    if (Array.isArray(value)) {
      return setClassesFromString(el, value.join(" "));
    } else if (typeof value === "object" && value !== null) {
      return setClassesFromObject(el, value);
    } else if (typeof value === "function") {
      return setClasses(el, value());
    }
    return setClassesFromString(el, value);
  }
  function setClassesFromString(el, classString) {
    let missingClasses = (classString2) => classString2.split(" ").filter((i) => !el.classList.contains(i)).filter(Boolean);
    let addClassesAndReturnUndo = (classes) => {
      el.classList.add(...classes);
      return () => {
        el.classList.remove(...classes);
      };
    };
    classString = classString === true ? classString = "" : classString || "";
    return addClassesAndReturnUndo(missingClasses(classString));
  }
  function setClassesFromObject(el, classObject) {
    let split = (classString) => classString.split(" ").filter(Boolean);
    let forAdd = Object.entries(classObject).flatMap(([classString, bool]) => bool ? split(classString) : false).filter(Boolean);
    let forRemove = Object.entries(classObject).flatMap(([classString, bool]) => !bool ? split(classString) : false).filter(Boolean);
    let added = [];
    let removed = [];
    forRemove.forEach((i) => {
      if (el.classList.contains(i)) {
        el.classList.remove(i);
        removed.push(i);
      }
    });
    forAdd.forEach((i) => {
      if (!el.classList.contains(i)) {
        el.classList.add(i);
        added.push(i);
      }
    });
    return () => {
      removed.forEach((i) => el.classList.add(i));
      added.forEach((i) => el.classList.remove(i));
    };
  }

  // packages/alpinejs/src/utils/styles.js
  function setStyles(el, value) {
    if (typeof value === "object" && value !== null) {
      return setStylesFromObject(el, value);
    }
    return setStylesFromString(el, value);
  }
  function setStylesFromObject(el, value) {
    let previousStyles = {};
    Object.entries(value).forEach(([key, value2]) => {
      previousStyles[key] = el.style[key];
      if (!key.startsWith("--")) {
        key = kebabCase(key);
      }
      el.style.setProperty(key, value2);
    });
    setTimeout(() => {
      if (el.style.length === 0) {
        el.removeAttribute("style");
      }
    });
    return () => {
      setStyles(el, previousStyles);
    };
  }
  function setStylesFromString(el, value) {
    let cache = el.getAttribute("style", value);
    el.setAttribute("style", value);
    return () => {
      el.setAttribute("style", cache || "");
    };
  }
  function kebabCase(subject) {
    return subject.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }

  // packages/alpinejs/src/utils/once.js
  function once(callback, fallback = () => {
  }) {
    let called = false;
    return function() {
      if (!called) {
        called = true;
        callback.apply(this, arguments);
      } else {
        fallback.apply(this, arguments);
      }
    };
  }

  // packages/alpinejs/src/directives/x-transition.js
  directive("transition", (el, {value, modifiers, expression}, {evaluate: evaluate2}) => {
    if (typeof expression === "function")
      expression = evaluate2(expression);
    if (expression === false)
      return;
    if (!expression || typeof expression === "boolean") {
      registerTransitionsFromHelper(el, modifiers, value);
    } else {
      registerTransitionsFromClassString(el, expression, value);
    }
  });
  function registerTransitionsFromClassString(el, classString, stage) {
    registerTransitionObject(el, setClasses, "");
    let directiveStorageMap = {
      enter: (classes) => {
        el._x_transition.enter.during = classes;
      },
      "enter-start": (classes) => {
        el._x_transition.enter.start = classes;
      },
      "enter-end": (classes) => {
        el._x_transition.enter.end = classes;
      },
      leave: (classes) => {
        el._x_transition.leave.during = classes;
      },
      "leave-start": (classes) => {
        el._x_transition.leave.start = classes;
      },
      "leave-end": (classes) => {
        el._x_transition.leave.end = classes;
      }
    };
    directiveStorageMap[stage](classString);
  }
  function registerTransitionsFromHelper(el, modifiers, stage) {
    registerTransitionObject(el, setStyles);
    let doesntSpecify = !modifiers.includes("in") && !modifiers.includes("out") && !stage;
    let transitioningIn = doesntSpecify || modifiers.includes("in") || ["enter"].includes(stage);
    let transitioningOut = doesntSpecify || modifiers.includes("out") || ["leave"].includes(stage);
    if (modifiers.includes("in") && !doesntSpecify) {
      modifiers = modifiers.filter((i, index) => index < modifiers.indexOf("out"));
    }
    if (modifiers.includes("out") && !doesntSpecify) {
      modifiers = modifiers.filter((i, index) => index > modifiers.indexOf("out"));
    }
    let wantsAll = !modifiers.includes("opacity") && !modifiers.includes("scale");
    let wantsOpacity = wantsAll || modifiers.includes("opacity");
    let wantsScale = wantsAll || modifiers.includes("scale");
    let opacityValue = wantsOpacity ? 0 : 1;
    let scaleValue = wantsScale ? modifierValue(modifiers, "scale", 95) / 100 : 1;
    let delay = modifierValue(modifiers, "delay", 0) / 1e3;
    let origin = modifierValue(modifiers, "origin", "center");
    let property = "opacity, transform";
    let durationIn = modifierValue(modifiers, "duration", 150) / 1e3;
    let durationOut = modifierValue(modifiers, "duration", 75) / 1e3;
    let easing = `cubic-bezier(0.4, 0.0, 0.2, 1)`;
    if (transitioningIn) {
      el._x_transition.enter.during = {
        transformOrigin: origin,
        transitionDelay: `${delay}s`,
        transitionProperty: property,
        transitionDuration: `${durationIn}s`,
        transitionTimingFunction: easing
      };
      el._x_transition.enter.start = {
        opacity: opacityValue,
        transform: `scale(${scaleValue})`
      };
      el._x_transition.enter.end = {
        opacity: 1,
        transform: `scale(1)`
      };
    }
    if (transitioningOut) {
      el._x_transition.leave.during = {
        transformOrigin: origin,
        transitionDelay: `${delay}s`,
        transitionProperty: property,
        transitionDuration: `${durationOut}s`,
        transitionTimingFunction: easing
      };
      el._x_transition.leave.start = {
        opacity: 1,
        transform: `scale(1)`
      };
      el._x_transition.leave.end = {
        opacity: opacityValue,
        transform: `scale(${scaleValue})`
      };
    }
  }
  function registerTransitionObject(el, setFunction, defaultValue = {}) {
    if (!el._x_transition)
      el._x_transition = {
        enter: {during: defaultValue, start: defaultValue, end: defaultValue},
        leave: {during: defaultValue, start: defaultValue, end: defaultValue},
        in(before = () => {
        }, after = () => {
        }) {
          transition(el, setFunction, {
            during: this.enter.during,
            start: this.enter.start,
            end: this.enter.end
          }, before, after);
        },
        out(before = () => {
        }, after = () => {
        }) {
          transition(el, setFunction, {
            during: this.leave.during,
            start: this.leave.start,
            end: this.leave.end
          }, before, after);
        }
      };
  }
  window.Element.prototype._x_toggleAndCascadeWithTransitions = function(el, value, show, hide) {
    const nextTick2 = document.visibilityState === "visible" ? requestAnimationFrame : setTimeout;
    let clickAwayCompatibleShow = () => nextTick2(show);
    if (value) {
      if (el._x_transition && (el._x_transition.enter || el._x_transition.leave)) {
        el._x_transition.enter && (Object.entries(el._x_transition.enter.during).length || Object.entries(el._x_transition.enter.start).length || Object.entries(el._x_transition.enter.end).length) ? el._x_transition.in(show) : clickAwayCompatibleShow();
      } else {
        el._x_transition ? el._x_transition.in(show) : clickAwayCompatibleShow();
      }
      return;
    }
    el._x_hidePromise = el._x_transition ? new Promise((resolve, reject) => {
      el._x_transition.out(() => {
      }, () => resolve(hide));
      el._x_transitioning.beforeCancel(() => reject({isFromCancelledTransition: true}));
    }) : Promise.resolve(hide);
    queueMicrotask(() => {
      let closest = closestHide(el);
      if (closest) {
        if (!closest._x_hideChildren)
          closest._x_hideChildren = [];
        closest._x_hideChildren.push(el);
      } else {
        nextTick2(() => {
          let hideAfterChildren = (el2) => {
            let carry = Promise.all([
              el2._x_hidePromise,
              ...(el2._x_hideChildren || []).map(hideAfterChildren)
            ]).then(([i]) => i());
            delete el2._x_hidePromise;
            delete el2._x_hideChildren;
            return carry;
          };
          hideAfterChildren(el).catch((e) => {
            if (!e.isFromCancelledTransition)
              throw e;
          });
        });
      }
    });
  };
  function closestHide(el) {
    let parent = el.parentNode;
    if (!parent)
      return;
    return parent._x_hidePromise ? parent : closestHide(parent);
  }
  function transition(el, setFunction, {during, start: start2, end} = {}, before = () => {
  }, after = () => {
  }) {
    if (el._x_transitioning)
      el._x_transitioning.cancel();
    if (Object.keys(during).length === 0 && Object.keys(start2).length === 0 && Object.keys(end).length === 0) {
      before();
      after();
      return;
    }
    let undoStart, undoDuring, undoEnd;
    performTransition(el, {
      start() {
        undoStart = setFunction(el, start2);
      },
      during() {
        undoDuring = setFunction(el, during);
      },
      before,
      end() {
        undoStart();
        undoEnd = setFunction(el, end);
      },
      after,
      cleanup() {
        undoDuring();
        undoEnd();
      }
    });
  }
  function performTransition(el, stages) {
    let interrupted, reachedBefore, reachedEnd;
    let finish = once(() => {
      mutateDom(() => {
        interrupted = true;
        if (!reachedBefore)
          stages.before();
        if (!reachedEnd) {
          stages.end();
          releaseNextTicks();
        }
        stages.after();
        if (el.isConnected)
          stages.cleanup();
        delete el._x_transitioning;
      });
    });
    el._x_transitioning = {
      beforeCancels: [],
      beforeCancel(callback) {
        this.beforeCancels.push(callback);
      },
      cancel: once(function() {
        while (this.beforeCancels.length) {
          this.beforeCancels.shift()();
        }
        finish();
      }),
      finish
    };
    mutateDom(() => {
      stages.start();
      stages.during();
    });
    holdNextTicks();
    requestAnimationFrame(() => {
      if (interrupted)
        return;
      let duration = Number(getComputedStyle(el).transitionDuration.replace(/,.*/, "").replace("s", "")) * 1e3;
      let delay = Number(getComputedStyle(el).transitionDelay.replace(/,.*/, "").replace("s", "")) * 1e3;
      if (duration === 0)
        duration = Number(getComputedStyle(el).animationDuration.replace("s", "")) * 1e3;
      mutateDom(() => {
        stages.before();
      });
      reachedBefore = true;
      requestAnimationFrame(() => {
        if (interrupted)
          return;
        mutateDom(() => {
          stages.end();
        });
        releaseNextTicks();
        setTimeout(el._x_transitioning.finish, duration + delay);
        reachedEnd = true;
      });
    });
  }
  function modifierValue(modifiers, key, fallback) {
    if (modifiers.indexOf(key) === -1)
      return fallback;
    const rawValue = modifiers[modifiers.indexOf(key) + 1];
    if (!rawValue)
      return fallback;
    if (key === "scale") {
      if (isNaN(rawValue))
        return fallback;
    }
    if (key === "duration" || key === "delay") {
      let match = rawValue.match(/([0-9]+)ms/);
      if (match)
        return match[1];
    }
    if (key === "origin") {
      if (["top", "right", "left", "center", "bottom"].includes(modifiers[modifiers.indexOf(key) + 2])) {
        return [rawValue, modifiers[modifiers.indexOf(key) + 2]].join(" ");
      }
    }
    return rawValue;
  }

  // packages/alpinejs/src/clone.js
  var isCloning = false;
  function skipDuringClone(callback, fallback = () => {
  }) {
    return (...args) => isCloning ? fallback(...args) : callback(...args);
  }
  function onlyDuringClone(callback) {
    return (...args) => isCloning && callback(...args);
  }
  function clone(oldEl, newEl) {
    if (!newEl._x_dataStack)
      newEl._x_dataStack = oldEl._x_dataStack;
    isCloning = true;
    dontRegisterReactiveSideEffects(() => {
      cloneTree(newEl);
    });
    isCloning = false;
  }
  function cloneTree(el) {
    let hasRunThroughFirstEl = false;
    let shallowWalker = (el2, callback) => {
      walk(el2, (el3, skip) => {
        if (hasRunThroughFirstEl && isRoot(el3))
          return skip();
        hasRunThroughFirstEl = true;
        callback(el3, skip);
      });
    };
    initTree(el, shallowWalker);
  }
  function dontRegisterReactiveSideEffects(callback) {
    let cache = effect;
    overrideEffect((callback2, el) => {
      let storedEffect = cache(callback2);
      release(storedEffect);
      return () => {
      };
    });
    callback();
    overrideEffect(cache);
  }

  // packages/alpinejs/src/utils/bind.js
  function bind(el, name, value, modifiers = []) {
    if (!el._x_bindings)
      el._x_bindings = reactive({});
    el._x_bindings[name] = value;
    name = modifiers.includes("camel") ? camelCase(name) : name;
    switch (name) {
      case "value":
        bindInputValue(el, value);
        break;
      case "style":
        bindStyles(el, value);
        break;
      case "class":
        bindClasses(el, value);
        break;
      case "selected":
      case "checked":
        bindAttributeAndProperty(el, name, value);
        break;
      default:
        bindAttribute(el, name, value);
        break;
    }
  }
  function bindInputValue(el, value) {
    if (el.type === "radio") {
      if (el.attributes.value === void 0) {
        el.value = value;
      }
      if (window.fromModel) {
        el.checked = checkedAttrLooseCompare(el.value, value);
      }
    } else if (el.type === "checkbox") {
      if (Number.isInteger(value)) {
        el.value = value;
      } else if (!Number.isInteger(value) && !Array.isArray(value) && typeof value !== "boolean" && ![null, void 0].includes(value)) {
        el.value = String(value);
      } else {
        if (Array.isArray(value)) {
          el.checked = value.some((val) => checkedAttrLooseCompare(val, el.value));
        } else {
          el.checked = !!value;
        }
      }
    } else if (el.tagName === "SELECT") {
      updateSelect(el, value);
    } else {
      if (el.value === value)
        return;
      el.value = value;
    }
  }
  function bindClasses(el, value) {
    if (el._x_undoAddedClasses)
      el._x_undoAddedClasses();
    el._x_undoAddedClasses = setClasses(el, value);
  }
  function bindStyles(el, value) {
    if (el._x_undoAddedStyles)
      el._x_undoAddedStyles();
    el._x_undoAddedStyles = setStyles(el, value);
  }
  function bindAttributeAndProperty(el, name, value) {
    bindAttribute(el, name, value);
    setPropertyIfChanged(el, name, value);
  }
  function bindAttribute(el, name, value) {
    if ([null, void 0, false].includes(value) && attributeShouldntBePreservedIfFalsy(name)) {
      el.removeAttribute(name);
    } else {
      if (isBooleanAttr(name))
        value = name;
      setIfChanged(el, name, value);
    }
  }
  function setIfChanged(el, attrName, value) {
    if (el.getAttribute(attrName) != value) {
      el.setAttribute(attrName, value);
    }
  }
  function setPropertyIfChanged(el, propName, value) {
    if (el[propName] !== value) {
      el[propName] = value;
    }
  }
  function updateSelect(el, value) {
    const arrayWrappedValue = [].concat(value).map((value2) => {
      return value2 + "";
    });
    Array.from(el.options).forEach((option) => {
      option.selected = arrayWrappedValue.includes(option.value);
    });
  }
  function camelCase(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }
  function checkedAttrLooseCompare(valueA, valueB) {
    return valueA == valueB;
  }
  function isBooleanAttr(attrName) {
    const booleanAttributes = [
      "disabled",
      "checked",
      "required",
      "readonly",
      "hidden",
      "open",
      "selected",
      "autofocus",
      "itemscope",
      "multiple",
      "novalidate",
      "allowfullscreen",
      "allowpaymentrequest",
      "formnovalidate",
      "autoplay",
      "controls",
      "loop",
      "muted",
      "playsinline",
      "default",
      "ismap",
      "reversed",
      "async",
      "defer",
      "nomodule"
    ];
    return booleanAttributes.includes(attrName);
  }
  function attributeShouldntBePreservedIfFalsy(name) {
    return !["aria-pressed", "aria-checked", "aria-expanded", "aria-selected"].includes(name);
  }
  function getBinding(el, name, fallback) {
    if (el._x_bindings && el._x_bindings[name] !== void 0)
      return el._x_bindings[name];
    return getAttributeBinding(el, name, fallback);
  }
  function extractProp(el, name, fallback, extract = true) {
    if (el._x_bindings && el._x_bindings[name] !== void 0)
      return el._x_bindings[name];
    if (el._x_inlineBindings && el._x_inlineBindings[name] !== void 0) {
      let binding = el._x_inlineBindings[name];
      binding.extract = extract;
      return dontAutoEvaluateFunctions(() => {
        return evaluate$1(el, binding.expression);
      });
    }
    return getAttributeBinding(el, name, fallback);
  }
  function getAttributeBinding(el, name, fallback) {
    let attr = el.getAttribute(name);
    if (attr === null)
      return typeof fallback === "function" ? fallback() : fallback;
    if (attr === "")
      return true;
    if (isBooleanAttr(name)) {
      return !![name, "true"].includes(attr);
    }
    return attr;
  }

  // packages/alpinejs/src/utils/debounce.js
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // packages/alpinejs/src/utils/throttle.js
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      let context = this, args = arguments;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // packages/alpinejs/src/plugin.js
  function plugin(callback) {
    let callbacks = Array.isArray(callback) ? callback : [callback];
    callbacks.forEach((i) => i(alpine_default));
  }

  // packages/alpinejs/src/store.js
  var stores = {};
  var isReactive = false;
  function store(name, value) {
    if (!isReactive) {
      stores = reactive(stores);
      isReactive = true;
    }
    if (value === void 0) {
      return stores[name];
    }
    stores[name] = value;
    if (typeof value === "object" && value !== null && value.hasOwnProperty("init") && typeof value.init === "function") {
      stores[name].init();
    }
    initInterceptors(stores[name]);
  }
  function getStores() {
    return stores;
  }

  // packages/alpinejs/src/binds.js
  var binds = {};
  function bind2(name, bindings) {
    let getBindings = typeof bindings !== "function" ? () => bindings : bindings;
    if (name instanceof Element) {
      applyBindingsObject(name, getBindings());
    } else {
      binds[name] = getBindings;
    }
  }
  function injectBindingProviders(obj) {
    Object.entries(binds).forEach(([name, callback]) => {
      Object.defineProperty(obj, name, {
        get() {
          return (...args) => {
            return callback(...args);
          };
        }
      });
    });
    return obj;
  }
  function applyBindingsObject(el, obj, original) {
    let cleanupRunners = [];
    while (cleanupRunners.length)
      cleanupRunners.pop()();
    let attributes = Object.entries(obj).map(([name, value]) => ({name, value}));
    let staticAttributes = attributesOnly(attributes);
    attributes = attributes.map((attribute) => {
      if (staticAttributes.find((attr) => attr.name === attribute.name)) {
        return {
          name: `x-bind:${attribute.name}`,
          value: `"${attribute.value}"`
        };
      }
      return attribute;
    });
    directives(el, attributes, original).map((handle) => {
      cleanupRunners.push(handle.runCleanups);
      handle();
    });
  }

  // packages/alpinejs/src/datas.js
  var datas = {};
  function data(name, callback) {
    datas[name] = callback;
  }
  function injectDataProviders(obj, context) {
    Object.entries(datas).forEach(([name, callback]) => {
      Object.defineProperty(obj, name, {
        get() {
          return (...args) => {
            return callback.bind(context)(...args);
          };
        },
        enumerable: false
      });
    });
    return obj;
  }

  // packages/alpinejs/src/alpine.js
  var Alpine = {
    get reactive() {
      return reactive;
    },
    get release() {
      return release;
    },
    get effect() {
      return effect;
    },
    get raw() {
      return raw;
    },
    version: "3.12.3",
    flushAndStopDeferringMutations,
    dontAutoEvaluateFunctions,
    disableEffectScheduling,
    startObservingMutations,
    stopObservingMutations,
    setReactivityEngine,
    closestDataStack,
    skipDuringClone,
    onlyDuringClone,
    addRootSelector,
    addInitSelector,
    addScopeToNode,
    deferMutations,
    mapAttributes,
    evaluateLater,
    interceptInit,
    setEvaluator,
    mergeProxies,
    extractProp,
    findClosest,
    closestRoot,
    destroyTree,
    interceptor,
    transition,
    setStyles,
    mutateDom,
    directive,
    throttle,
    debounce,
    evaluate: evaluate$1,
    initTree,
    nextTick,
    prefixed: prefix$1,
    prefix: setPrefix,
    plugin,
    magic,
    store,
    start,
    clone,
    bound: getBinding,
    $data: scope,
    walk,
    data,
    bind: bind2
  };
  var alpine_default = Alpine;

  // node_modules/@vue/shared/dist/shared.esm-bundler.js
  function makeMap(str, expectsLowerCase) {
    const map = Object.create(null);
    const list = str.split(",");
    for (let i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
  }
  var EMPTY_OBJ = Object.freeze({}) ;
  var extend = Object.assign;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (val, key) => hasOwnProperty.call(val, key);
  var isArray = Array.isArray;
  var isMap = (val) => toTypeString(val) === "[object Map]";
  var isString = (val) => typeof val === "string";
  var isSymbol = (val) => typeof val === "symbol";
  var isObject = (val) => val !== null && typeof val === "object";
  var objectToString = Object.prototype.toString;
  var toTypeString = (value) => objectToString.call(value);
  var toRawType = (value) => {
    return toTypeString(value).slice(8, -1);
  };
  var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
  var cacheStringFunction = (fn) => {
    const cache = Object.create(null);
    return (str) => {
      const hit = cache[str];
      return hit || (cache[str] = fn(str));
    };
  };
  var capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
  var hasChanged = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);

  // node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js
  var targetMap = new WeakMap();
  var effectStack = [];
  var activeEffect;
  var ITERATE_KEY = Symbol("iterate" );
  var MAP_KEY_ITERATE_KEY = Symbol("Map key iterate" );
  function isEffect(fn) {
    return fn && fn._isEffect === true;
  }
  function effect2(fn, options = EMPTY_OBJ) {
    if (isEffect(fn)) {
      fn = fn.raw;
    }
    const effect3 = createReactiveEffect(fn, options);
    if (!options.lazy) {
      effect3();
    }
    return effect3;
  }
  function stop(effect3) {
    if (effect3.active) {
      cleanup(effect3);
      if (effect3.options.onStop) {
        effect3.options.onStop();
      }
      effect3.active = false;
    }
  }
  var uid = 0;
  function createReactiveEffect(fn, options) {
    const effect3 = function reactiveEffect() {
      if (!effect3.active) {
        return fn();
      }
      if (!effectStack.includes(effect3)) {
        cleanup(effect3);
        try {
          enableTracking();
          effectStack.push(effect3);
          activeEffect = effect3;
          return fn();
        } finally {
          effectStack.pop();
          resetTracking();
          activeEffect = effectStack[effectStack.length - 1];
        }
      }
    };
    effect3.id = uid++;
    effect3.allowRecurse = !!options.allowRecurse;
    effect3._isEffect = true;
    effect3.active = true;
    effect3.raw = fn;
    effect3.deps = [];
    effect3.options = options;
    return effect3;
  }
  function cleanup(effect3) {
    const {deps} = effect3;
    if (deps.length) {
      for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effect3);
      }
      deps.length = 0;
    }
  }
  var shouldTrack = true;
  var trackStack = [];
  function pauseTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = false;
  }
  function enableTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = true;
  }
  function resetTracking() {
    const last = trackStack.pop();
    shouldTrack = last === void 0 ? true : last;
  }
  function track(target, type, key) {
    if (!shouldTrack || activeEffect === void 0) {
      return;
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = new Set());
    }
    if (!dep.has(activeEffect)) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
      if (activeEffect.options.onTrack) {
        activeEffect.options.onTrack({
          effect: activeEffect,
          target,
          type,
          key
        });
      }
    }
  }
  function trigger(target, type, key, newValue, oldValue, oldTarget) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
      return;
    }
    const effects = new Set();
    const add2 = (effectsToAdd) => {
      if (effectsToAdd) {
        effectsToAdd.forEach((effect3) => {
          if (effect3 !== activeEffect || effect3.allowRecurse) {
            effects.add(effect3);
          }
        });
      }
    };
    if (type === "clear") {
      depsMap.forEach(add2);
    } else if (key === "length" && isArray(target)) {
      depsMap.forEach((dep, key2) => {
        if (key2 === "length" || key2 >= newValue) {
          add2(dep);
        }
      });
    } else {
      if (key !== void 0) {
        add2(depsMap.get(key));
      }
      switch (type) {
        case "add":
          if (!isArray(target)) {
            add2(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              add2(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          } else if (isIntegerKey(key)) {
            add2(depsMap.get("length"));
          }
          break;
        case "delete":
          if (!isArray(target)) {
            add2(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              add2(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          }
          break;
        case "set":
          if (isMap(target)) {
            add2(depsMap.get(ITERATE_KEY));
          }
          break;
      }
    }
    const run = (effect3) => {
      if (effect3.options.onTrigger) {
        effect3.options.onTrigger({
          effect: effect3,
          target,
          key,
          type,
          newValue,
          oldValue,
          oldTarget
        });
      }
      if (effect3.options.scheduler) {
        effect3.options.scheduler(effect3);
      } else {
        effect3();
      }
    };
    effects.forEach(run);
  }
  var isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
  var builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol).map((key) => Symbol[key]).filter(isSymbol));
  var get2 = /* @__PURE__ */ createGetter();
  var shallowGet = /* @__PURE__ */ createGetter(false, true);
  var readonlyGet = /* @__PURE__ */ createGetter(true);
  var shallowReadonlyGet = /* @__PURE__ */ createGetter(true, true);
  var arrayInstrumentations = {};
  ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
    const method = Array.prototype[key];
    arrayInstrumentations[key] = function(...args) {
      const arr = toRaw(this);
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, "get", i + "");
      }
      const res = method.apply(arr, args);
      if (res === -1 || res === false) {
        return method.apply(arr, args.map(toRaw));
      } else {
        return res;
      }
    };
  });
  ["push", "pop", "shift", "unshift", "splice"].forEach((key) => {
    const method = Array.prototype[key];
    arrayInstrumentations[key] = function(...args) {
      pauseTracking();
      const res = method.apply(this, args);
      resetTracking();
      return res;
    };
  });
  function createGetter(isReadonly = false, shallow = false) {
    return function get3(target, key, receiver) {
      if (key === "__v_isReactive") {
        return !isReadonly;
      } else if (key === "__v_isReadonly") {
        return isReadonly;
      } else if (key === "__v_raw" && receiver === (isReadonly ? shallow ? shallowReadonlyMap : readonlyMap : shallow ? shallowReactiveMap : reactiveMap).get(target)) {
        return target;
      }
      const targetIsArray = isArray(target);
      if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }
      const res = Reflect.get(target, key, receiver);
      if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
        return res;
      }
      if (!isReadonly) {
        track(target, "get", key);
      }
      if (shallow) {
        return res;
      }
      if (isRef(res)) {
        const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
        return shouldUnwrap ? res.value : res;
      }
      if (isObject(res)) {
        return isReadonly ? readonly(res) : reactive2(res);
      }
      return res;
    };
  }
  var set2 = /* @__PURE__ */ createSetter();
  var shallowSet = /* @__PURE__ */ createSetter(true);
  function createSetter(shallow = false) {
    return function set3(target, key, value, receiver) {
      let oldValue = target[key];
      if (!shallow) {
        value = toRaw(value);
        oldValue = toRaw(oldValue);
        if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
          oldValue.value = value;
          return true;
        }
      }
      const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
      const result = Reflect.set(target, key, value, receiver);
      if (target === toRaw(receiver)) {
        if (!hadKey) {
          trigger(target, "add", key, value);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, "set", key, value, oldValue);
        }
      }
      return result;
    };
  }
  function deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    const oldValue = target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  function has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, "has", key);
    }
    return result;
  }
  function ownKeys(target) {
    track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
    return Reflect.ownKeys(target);
  }
  var mutableHandlers = {
    get: get2,
    set: set2,
    deleteProperty,
    has,
    ownKeys
  };
  var readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
      {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
      }
      return true;
    },
    deleteProperty(target, key) {
      {
        console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
      }
      return true;
    }
  };
  extend({}, mutableHandlers, {
    get: shallowGet,
    set: shallowSet
  });
  extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
  });
  var toReactive = (value) => isObject(value) ? reactive2(value) : value;
  var toReadonly = (value) => isObject(value) ? readonly(value) : value;
  var toShallow = (value) => value;
  var getProto = (v) => Reflect.getPrototypeOf(v);
  function get$1(target, key, isReadonly = false, isShallow = false) {
    target = target["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (key !== rawKey) {
      !isReadonly && track(rawTarget, "get", key);
    }
    !isReadonly && track(rawTarget, "get", rawKey);
    const {has: has2} = getProto(rawTarget);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    if (has2.call(rawTarget, key)) {
      return wrap(target.get(key));
    } else if (has2.call(rawTarget, rawKey)) {
      return wrap(target.get(rawKey));
    } else if (target !== rawTarget) {
      target.get(key);
    }
  }
  function has$1(key, isReadonly = false) {
    const target = this["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (key !== rawKey) {
      !isReadonly && track(rawTarget, "has", key);
    }
    !isReadonly && track(rawTarget, "has", rawKey);
    return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
  }
  function size(target, isReadonly = false) {
    target = target["__v_raw"];
    !isReadonly && track(toRaw(target), "iterate", ITERATE_KEY);
    return Reflect.get(target, "size", target);
  }
  function add(value) {
    value = toRaw(value);
    const target = toRaw(this);
    const proto = getProto(target);
    const hadKey = proto.has.call(target, value);
    if (!hadKey) {
      target.add(value);
      trigger(target, "add", value, value);
    }
    return this;
  }
  function set$1(key, value) {
    value = toRaw(value);
    const target = toRaw(this);
    const {has: has2, get: get3} = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    } else {
      checkIdentityKeys(target, has2, key);
    }
    const oldValue = get3.call(target, key);
    target.set(key, value);
    if (!hadKey) {
      trigger(target, "add", key, value);
    } else if (hasChanged(value, oldValue)) {
      trigger(target, "set", key, value, oldValue);
    }
    return this;
  }
  function deleteEntry(key) {
    const target = toRaw(this);
    const {has: has2, get: get3} = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    } else {
      checkIdentityKeys(target, has2, key);
    }
    const oldValue = get3 ? get3.call(target, key) : void 0;
    const result = target.delete(key);
    if (hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  function clear() {
    const target = toRaw(this);
    const hadItems = target.size !== 0;
    const oldTarget = isMap(target) ? new Map(target) : new Set(target) ;
    const result = target.clear();
    if (hadItems) {
      trigger(target, "clear", void 0, void 0, oldTarget);
    }
    return result;
  }
  function createForEach(isReadonly, isShallow) {
    return function forEach(callback, thisArg) {
      const observed = this;
      const target = observed["__v_raw"];
      const rawTarget = toRaw(target);
      const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
      !isReadonly && track(rawTarget, "iterate", ITERATE_KEY);
      return target.forEach((value, key) => {
        return callback.call(thisArg, wrap(value), wrap(key), observed);
      });
    };
  }
  function createIterableMethod(method, isReadonly, isShallow) {
    return function(...args) {
      const target = this["__v_raw"];
      const rawTarget = toRaw(target);
      const targetIsMap = isMap(rawTarget);
      const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
      const isKeyOnly = method === "keys" && targetIsMap;
      const innerIterator = target[method](...args);
      const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
      !isReadonly && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
      return {
        next() {
          const {value, done} = innerIterator.next();
          return done ? {value, done} : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done
          };
        },
        [Symbol.iterator]() {
          return this;
        }
      };
    };
  }
  function createReadonlyMethod(type) {
    return function(...args) {
      {
        const key = args[0] ? `on key "${args[0]}" ` : ``;
        console.warn(`${capitalize(type)} operation ${key}failed: target is readonly.`, toRaw(this));
      }
      return type === "delete" ? false : this;
    };
  }
  var mutableInstrumentations = {
    get(key) {
      return get$1(this, key);
    },
    get size() {
      return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, false)
  };
  var shallowInstrumentations = {
    get(key) {
      return get$1(this, key, false, true);
    },
    get size() {
      return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, true)
  };
  var readonlyInstrumentations = {
    get(key) {
      return get$1(this, key, true);
    },
    get size() {
      return size(this, true);
    },
    has(key) {
      return has$1.call(this, key, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, false)
  };
  var shallowReadonlyInstrumentations = {
    get(key) {
      return get$1(this, key, true, true);
    },
    get size() {
      return size(this, true);
    },
    has(key) {
      return has$1.call(this, key, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, true)
  };
  var iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
  iteratorMethods.forEach((method) => {
    mutableInstrumentations[method] = createIterableMethod(method, false, false);
    readonlyInstrumentations[method] = createIterableMethod(method, true, false);
    shallowInstrumentations[method] = createIterableMethod(method, false, true);
    shallowReadonlyInstrumentations[method] = createIterableMethod(method, true, true);
  });
  function createInstrumentationGetter(isReadonly, shallow) {
    const instrumentations = shallow ? isReadonly ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly ? readonlyInstrumentations : mutableInstrumentations;
    return (target, key, receiver) => {
      if (key === "__v_isReactive") {
        return !isReadonly;
      } else if (key === "__v_isReadonly") {
        return isReadonly;
      } else if (key === "__v_raw") {
        return target;
      }
      return Reflect.get(hasOwn(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
    };
  }
  var mutableCollectionHandlers = {
    get: createInstrumentationGetter(false, false)
  };
  var readonlyCollectionHandlers = {
    get: createInstrumentationGetter(true, false)
  };
  function checkIdentityKeys(target, has2, key) {
    const rawKey = toRaw(key);
    if (rawKey !== key && has2.call(target, rawKey)) {
      const type = toRawType(target);
      console.warn(`Reactive ${type} contains both the raw and reactive versions of the same object${type === `Map` ? ` as keys` : ``}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`);
    }
  }
  var reactiveMap = new WeakMap();
  var shallowReactiveMap = new WeakMap();
  var readonlyMap = new WeakMap();
  var shallowReadonlyMap = new WeakMap();
  function targetTypeMap(rawType) {
    switch (rawType) {
      case "Object":
      case "Array":
        return 1;
      case "Map":
      case "Set":
      case "WeakMap":
      case "WeakSet":
        return 2;
      default:
        return 0;
    }
  }
  function getTargetType(value) {
    return value["__v_skip"] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
  }
  function reactive2(target) {
    if (target && target["__v_isReadonly"]) {
      return target;
    }
    return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
  }
  function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
  }
  function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers, proxyMap) {
    if (!isObject(target)) {
      {
        console.warn(`value cannot be made reactive: ${String(target)}`);
      }
      return target;
    }
    if (target["__v_raw"] && !(isReadonly && target["__v_isReactive"])) {
      return target;
    }
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
      return existingProxy;
    }
    const targetType = getTargetType(target);
    if (targetType === 0) {
      return target;
    }
    const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
  }
  function toRaw(observed) {
    return observed && toRaw(observed["__v_raw"]) || observed;
  }
  function isRef(r) {
    return Boolean(r && r.__v_isRef === true);
  }

  // packages/alpinejs/src/magics/$nextTick.js
  magic("nextTick", () => nextTick);

  // packages/alpinejs/src/magics/$dispatch.js
  magic("dispatch", (el) => dispatch.bind(dispatch, el));

  // packages/alpinejs/src/magics/$watch.js
  magic("watch", (el, {evaluateLater: evaluateLater2, effect: effect3}) => (key, callback) => {
    let evaluate2 = evaluateLater2(key);
    let firstTime = true;
    let oldValue;
    let effectReference = effect3(() => evaluate2((value) => {
      JSON.stringify(value);
      if (!firstTime) {
        queueMicrotask(() => {
          callback(value, oldValue);
          oldValue = value;
        });
      } else {
        oldValue = value;
      }
      firstTime = false;
    }));
    el._x_effects.delete(effectReference);
  });

  // packages/alpinejs/src/magics/$store.js
  magic("store", getStores);

  // packages/alpinejs/src/magics/$data.js
  magic("data", (el) => scope(el));

  // packages/alpinejs/src/magics/$root.js
  magic("root", (el) => closestRoot(el));

  // packages/alpinejs/src/magics/$refs.js
  magic("refs", (el) => {
    if (el._x_refs_proxy)
      return el._x_refs_proxy;
    el._x_refs_proxy = mergeProxies(getArrayOfRefObject(el));
    return el._x_refs_proxy;
  });
  function getArrayOfRefObject(el) {
    let refObjects = [];
    let currentEl = el;
    while (currentEl) {
      if (currentEl._x_refs)
        refObjects.push(currentEl._x_refs);
      currentEl = currentEl.parentNode;
    }
    return refObjects;
  }

  // packages/alpinejs/src/ids.js
  var globalIdMemo = {};
  function findAndIncrementId(name) {
    if (!globalIdMemo[name])
      globalIdMemo[name] = 0;
    return ++globalIdMemo[name];
  }
  function closestIdRoot(el, name) {
    return findClosest(el, (element) => {
      if (element._x_ids && element._x_ids[name])
        return true;
    });
  }
  function setIdRoot(el, name) {
    if (!el._x_ids)
      el._x_ids = {};
    if (!el._x_ids[name])
      el._x_ids[name] = findAndIncrementId(name);
  }

  // packages/alpinejs/src/magics/$id.js
  magic("id", (el) => (name, key = null) => {
    let root = closestIdRoot(el, name);
    let id = root ? root._x_ids[name] : findAndIncrementId(name);
    return key ? `${name}-${id}-${key}` : `${name}-${id}`;
  });

  // packages/alpinejs/src/magics/$el.js
  magic("el", (el) => el);

  // packages/alpinejs/src/magics/index.js
  warnMissingPluginMagic("Focus", "focus", "focus");
  warnMissingPluginMagic("Persist", "persist", "persist");
  function warnMissingPluginMagic(name, magicName, slug) {
    magic(magicName, (el) => warn(`You can't use [$${directiveName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`, el));
  }

  // packages/alpinejs/src/entangle.js
  function entangle({get: outerGet, set: outerSet}, {get: innerGet, set: innerSet}) {
    let firstRun = true;
    let outerHash, outerHashLatest;
    let reference = effect(() => {
      let outer, inner;
      if (firstRun) {
        outer = outerGet();
        innerSet(outer);
        inner = innerGet();
        firstRun = false;
      } else {
        outer = outerGet();
        inner = innerGet();
        outerHashLatest = JSON.stringify(outer);
        JSON.stringify(inner);
        if (outerHashLatest !== outerHash) {
          inner = innerGet();
          innerSet(outer);
          inner = outer;
        } else {
          outerSet(inner);
          outer = inner;
        }
      }
      outerHash = JSON.stringify(outer);
      JSON.stringify(inner);
    });
    return () => {
      release(reference);
    };
  }

  // packages/alpinejs/src/directives/x-modelable.js
  directive("modelable", (el, {expression}, {effect: effect3, evaluateLater: evaluateLater2, cleanup: cleanup2}) => {
    let func = evaluateLater2(expression);
    let innerGet = () => {
      let result;
      func((i) => result = i);
      return result;
    };
    let evaluateInnerSet = evaluateLater2(`${expression} = __placeholder`);
    let innerSet = (val) => evaluateInnerSet(() => {
    }, {scope: {__placeholder: val}});
    let initialValue = innerGet();
    innerSet(initialValue);
    queueMicrotask(() => {
      if (!el._x_model)
        return;
      el._x_removeModelListeners["default"]();
      let outerGet = el._x_model.get;
      let outerSet = el._x_model.set;
      let releaseEntanglement = entangle({
        get() {
          return outerGet();
        },
        set(value) {
          outerSet(value);
        }
      }, {
        get() {
          return innerGet();
        },
        set(value) {
          innerSet(value);
        }
      });
      cleanup2(releaseEntanglement);
    });
  });

  // packages/alpinejs/src/directives/x-teleport.js
  var teleportContainerDuringClone = document.createElement("div");
  directive("teleport", (el, {modifiers, expression}, {cleanup: cleanup2}) => {
    if (el.tagName.toLowerCase() !== "template")
      warn("x-teleport can only be used on a <template> tag", el);
    let target = skipDuringClone(() => {
      return document.querySelector(expression);
    }, () => {
      return teleportContainerDuringClone;
    })();
    if (!target)
      warn(`Cannot find x-teleport element for selector: "${expression}"`);
    let clone2 = el.content.cloneNode(true).firstElementChild;
    el._x_teleport = clone2;
    clone2._x_teleportBack = el;
    if (el._x_forwardEvents) {
      el._x_forwardEvents.forEach((eventName) => {
        clone2.addEventListener(eventName, (e) => {
          e.stopPropagation();
          el.dispatchEvent(new e.constructor(e.type, e));
        });
      });
    }
    addScopeToNode(clone2, {}, el);
    mutateDom(() => {
      if (modifiers.includes("prepend")) {
        target.parentNode.insertBefore(clone2, target);
      } else if (modifiers.includes("append")) {
        target.parentNode.insertBefore(clone2, target.nextSibling);
      } else {
        target.appendChild(clone2);
      }
      initTree(clone2);
      clone2._x_ignore = true;
    });
    cleanup2(() => clone2.remove());
  });

  // packages/alpinejs/src/directives/x-ignore.js
  var handler = () => {
  };
  handler.inline = (el, {modifiers}, {cleanup: cleanup2}) => {
    modifiers.includes("self") ? el._x_ignoreSelf = true : el._x_ignore = true;
    cleanup2(() => {
      modifiers.includes("self") ? delete el._x_ignoreSelf : delete el._x_ignore;
    });
  };
  directive("ignore", handler);

  // packages/alpinejs/src/directives/x-effect.js
  directive("effect", (el, {expression}, {effect: effect3}) => effect3(evaluateLater(el, expression)));

  // packages/alpinejs/src/utils/on.js
  function on(el, event, modifiers, callback) {
    let listenerTarget = el;
    let handler4 = (e) => callback(e);
    let options = {};
    let wrapHandler = (callback2, wrapper) => (e) => wrapper(callback2, e);
    if (modifiers.includes("dot"))
      event = dotSyntax(event);
    if (modifiers.includes("camel"))
      event = camelCase2(event);
    if (modifiers.includes("passive"))
      options.passive = true;
    if (modifiers.includes("capture"))
      options.capture = true;
    if (modifiers.includes("window"))
      listenerTarget = window;
    if (modifiers.includes("document"))
      listenerTarget = document;
    if (modifiers.includes("debounce")) {
      let nextModifier = modifiers[modifiers.indexOf("debounce") + 1] || "invalid-wait";
      let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler4 = debounce(handler4, wait);
    }
    if (modifiers.includes("throttle")) {
      let nextModifier = modifiers[modifiers.indexOf("throttle") + 1] || "invalid-wait";
      let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler4 = throttle(handler4, wait);
    }
    if (modifiers.includes("prevent"))
      handler4 = wrapHandler(handler4, (next, e) => {
        e.preventDefault();
        next(e);
      });
    if (modifiers.includes("stop"))
      handler4 = wrapHandler(handler4, (next, e) => {
        e.stopPropagation();
        next(e);
      });
    if (modifiers.includes("self"))
      handler4 = wrapHandler(handler4, (next, e) => {
        e.target === el && next(e);
      });
    if (modifiers.includes("away") || modifiers.includes("outside")) {
      listenerTarget = document;
      handler4 = wrapHandler(handler4, (next, e) => {
        if (el.contains(e.target))
          return;
        if (e.target.isConnected === false)
          return;
        if (el.offsetWidth < 1 && el.offsetHeight < 1)
          return;
        if (el._x_isShown === false)
          return;
        next(e);
      });
    }
    if (modifiers.includes("once")) {
      handler4 = wrapHandler(handler4, (next, e) => {
        next(e);
        listenerTarget.removeEventListener(event, handler4, options);
      });
    }
    handler4 = wrapHandler(handler4, (next, e) => {
      if (isKeyEvent(event)) {
        if (isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers)) {
          return;
        }
      }
      next(e);
    });
    listenerTarget.addEventListener(event, handler4, options);
    return () => {
      listenerTarget.removeEventListener(event, handler4, options);
    };
  }
  function dotSyntax(subject) {
    return subject.replace(/-/g, ".");
  }
  function camelCase2(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }
  function isNumeric(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function kebabCase2(subject) {
    if ([" ", "_"].includes(subject))
      return subject;
    return subject.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[_\s]/, "-").toLowerCase();
  }
  function isKeyEvent(event) {
    return ["keydown", "keyup"].includes(event);
  }
  function isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers) {
    let keyModifiers = modifiers.filter((i) => {
      return !["window", "document", "prevent", "stop", "once", "capture"].includes(i);
    });
    if (keyModifiers.includes("debounce")) {
      let debounceIndex = keyModifiers.indexOf("debounce");
      keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
    }
    if (keyModifiers.includes("throttle")) {
      let debounceIndex = keyModifiers.indexOf("throttle");
      keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
    }
    if (keyModifiers.length === 0)
      return false;
    if (keyModifiers.length === 1 && keyToModifiers(e.key).includes(keyModifiers[0]))
      return false;
    const systemKeyModifiers = ["ctrl", "shift", "alt", "meta", "cmd", "super"];
    const selectedSystemKeyModifiers = systemKeyModifiers.filter((modifier) => keyModifiers.includes(modifier));
    keyModifiers = keyModifiers.filter((i) => !selectedSystemKeyModifiers.includes(i));
    if (selectedSystemKeyModifiers.length > 0) {
      const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter((modifier) => {
        if (modifier === "cmd" || modifier === "super")
          modifier = "meta";
        return e[`${modifier}Key`];
      });
      if (activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length) {
        if (keyToModifiers(e.key).includes(keyModifiers[0]))
          return false;
      }
    }
    return true;
  }
  function keyToModifiers(key) {
    if (!key)
      return [];
    key = kebabCase2(key);
    let modifierToKeyMap = {
      ctrl: "control",
      slash: "/",
      space: " ",
      spacebar: " ",
      cmd: "meta",
      esc: "escape",
      up: "arrow-up",
      down: "arrow-down",
      left: "arrow-left",
      right: "arrow-right",
      period: ".",
      equal: "=",
      minus: "-",
      underscore: "_"
    };
    modifierToKeyMap[key] = key;
    return Object.keys(modifierToKeyMap).map((modifier) => {
      if (modifierToKeyMap[modifier] === key)
        return modifier;
    }).filter((modifier) => modifier);
  }

  // packages/alpinejs/src/directives/x-model.js
  directive("model", (el, {modifiers, expression}, {effect: effect3, cleanup: cleanup2}) => {
    let scopeTarget = el;
    if (modifiers.includes("parent")) {
      scopeTarget = el.parentNode;
    }
    let evaluateGet = evaluateLater(scopeTarget, expression);
    let evaluateSet;
    if (typeof expression === "string") {
      evaluateSet = evaluateLater(scopeTarget, `${expression} = __placeholder`);
    } else if (typeof expression === "function" && typeof expression() === "string") {
      evaluateSet = evaluateLater(scopeTarget, `${expression()} = __placeholder`);
    } else {
      evaluateSet = () => {
      };
    }
    let getValue = () => {
      let result;
      evaluateGet((value) => result = value);
      return isGetterSetter(result) ? result.get() : result;
    };
    let setValue = (value) => {
      let result;
      evaluateGet((value2) => result = value2);
      if (isGetterSetter(result)) {
        result.set(value);
      } else {
        evaluateSet(() => {
        }, {
          scope: {__placeholder: value}
        });
      }
    };
    if (typeof expression === "string" && el.type === "radio") {
      mutateDom(() => {
        if (!el.hasAttribute("name"))
          el.setAttribute("name", expression);
      });
    }
    var event = el.tagName.toLowerCase() === "select" || ["checkbox", "radio"].includes(el.type) || modifiers.includes("lazy") ? "change" : "input";
    let removeListener = isCloning ? () => {
    } : on(el, event, modifiers, (e) => {
      setValue(getInputValue(el, modifiers, e, getValue()));
    });
    if (modifiers.includes("fill") && [null, ""].includes(getValue())) {
      el.dispatchEvent(new Event(event, {}));
    }
    if (!el._x_removeModelListeners)
      el._x_removeModelListeners = {};
    el._x_removeModelListeners["default"] = removeListener;
    cleanup2(() => el._x_removeModelListeners["default"]());
    if (el.form) {
      let removeResetListener = on(el.form, "reset", [], (e) => {
        nextTick(() => el._x_model && el._x_model.set(el.value));
      });
      cleanup2(() => removeResetListener());
    }
    el._x_model = {
      get() {
        return getValue();
      },
      set(value) {
        setValue(value);
      }
    };
    el._x_forceModelUpdate = (value) => {
      value = value === void 0 ? getValue() : value;
      if (value === void 0 && typeof expression === "string" && expression.match(/\./))
        value = "";
      window.fromModel = true;
      mutateDom(() => bind(el, "value", value));
      delete window.fromModel;
    };
    effect3(() => {
      let value = getValue();
      if (modifiers.includes("unintrusive") && document.activeElement.isSameNode(el))
        return;
      el._x_forceModelUpdate(value);
    });
  });
  function getInputValue(el, modifiers, event, currentValue) {
    return mutateDom(() => {
      if (event instanceof CustomEvent && event.detail !== void 0)
        return event.detail ?? event.target.value;
      else if (el.type === "checkbox") {
        if (Array.isArray(currentValue)) {
          let newValue = modifiers.includes("number") ? safeParseNumber(event.target.value) : event.target.value;
          return event.target.checked ? currentValue.concat([newValue]) : currentValue.filter((el2) => !checkedAttrLooseCompare2(el2, newValue));
        } else {
          return event.target.checked;
        }
      } else if (el.tagName.toLowerCase() === "select" && el.multiple) {
        return modifiers.includes("number") ? Array.from(event.target.selectedOptions).map((option) => {
          let rawValue = option.value || option.text;
          return safeParseNumber(rawValue);
        }) : Array.from(event.target.selectedOptions).map((option) => {
          return option.value || option.text;
        });
      } else {
        let rawValue = event.target.value;
        return modifiers.includes("number") ? safeParseNumber(rawValue) : modifiers.includes("trim") ? rawValue.trim() : rawValue;
      }
    });
  }
  function safeParseNumber(rawValue) {
    let number = rawValue ? parseFloat(rawValue) : null;
    return isNumeric2(number) ? number : rawValue;
  }
  function checkedAttrLooseCompare2(valueA, valueB) {
    return valueA == valueB;
  }
  function isNumeric2(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function isGetterSetter(value) {
    return value !== null && typeof value === "object" && typeof value.get === "function" && typeof value.set === "function";
  }

  // packages/alpinejs/src/directives/x-cloak.js
  directive("cloak", (el) => queueMicrotask(() => mutateDom(() => el.removeAttribute(prefix$1("cloak")))));

  // packages/alpinejs/src/directives/x-init.js
  addInitSelector(() => `[${prefix$1("init")}]`);
  directive("init", skipDuringClone((el, {expression}, {evaluate: evaluate2}) => {
    if (typeof expression === "string") {
      return !!expression.trim() && evaluate2(expression, {}, false);
    }
    return evaluate2(expression, {}, false);
  }));

  // packages/alpinejs/src/directives/x-text.js
  directive("text", (el, {expression}, {effect: effect3, evaluateLater: evaluateLater2}) => {
    let evaluate2 = evaluateLater2(expression);
    effect3(() => {
      evaluate2((value) => {
        mutateDom(() => {
          el.textContent = value;
        });
      });
    });
  });

  // packages/alpinejs/src/directives/x-html.js
  directive("html", (el, {expression}, {effect: effect3, evaluateLater: evaluateLater2}) => {
    let evaluate2 = evaluateLater2(expression);
    effect3(() => {
      evaluate2((value) => {
        mutateDom(() => {
          el.innerHTML = value;
          el._x_ignoreSelf = true;
          initTree(el);
          delete el._x_ignoreSelf;
        });
      });
    });
  });

  // packages/alpinejs/src/directives/x-bind.js
  mapAttributes(startingWith(":", into(prefix$1("bind:"))));
  var handler2 = (el, {value, modifiers, expression, original}, {effect: effect3}) => {
    if (!value) {
      let bindingProviders = {};
      injectBindingProviders(bindingProviders);
      let getBindings = evaluateLater(el, expression);
      getBindings((bindings) => {
        applyBindingsObject(el, bindings, original);
      }, {scope: bindingProviders});
      return;
    }
    if (value === "key")
      return storeKeyForXFor(el, expression);
    if (el._x_inlineBindings && el._x_inlineBindings[value] && el._x_inlineBindings[value].extract) {
      return;
    }
    let evaluate2 = evaluateLater(el, expression);
    effect3(() => evaluate2((result) => {
      if (result === void 0 && typeof expression === "string" && expression.match(/\./)) {
        result = "";
      }
      mutateDom(() => bind(el, value, result, modifiers));
    }));
  };
  handler2.inline = (el, {value, modifiers, expression}) => {
    if (!value)
      return;
    if (!el._x_inlineBindings)
      el._x_inlineBindings = {};
    el._x_inlineBindings[value] = {expression, extract: false};
  };
  directive("bind", handler2);
  function storeKeyForXFor(el, expression) {
    el._x_keyExpression = expression;
  }

  // packages/alpinejs/src/directives/x-data.js
  addRootSelector(() => `[${prefix$1("data")}]`);
  directive("data", skipDuringClone((el, {expression}, {cleanup: cleanup2}) => {
    expression = expression === "" ? "{}" : expression;
    let magicContext = {};
    injectMagics(magicContext, el);
    let dataProviderContext = {};
    injectDataProviders(dataProviderContext, magicContext);
    let data2 = evaluate$1(el, expression, {scope: dataProviderContext});
    if (data2 === void 0 || data2 === true)
      data2 = {};
    injectMagics(data2, el);
    let reactiveData = reactive(data2);
    initInterceptors(reactiveData);
    let undo = addScopeToNode(el, reactiveData);
    reactiveData["init"] && evaluate$1(el, reactiveData["init"]);
    cleanup2(() => {
      reactiveData["destroy"] && evaluate$1(el, reactiveData["destroy"]);
      undo();
    });
  }));

  // packages/alpinejs/src/directives/x-show.js
  directive("show", (el, {modifiers, expression}, {effect: effect3}) => {
    let evaluate2 = evaluateLater(el, expression);
    if (!el._x_doHide)
      el._x_doHide = () => {
        mutateDom(() => {
          el.style.setProperty("display", "none", modifiers.includes("important") ? "important" : void 0);
        });
      };
    if (!el._x_doShow)
      el._x_doShow = () => {
        mutateDom(() => {
          if (el.style.length === 1 && el.style.display === "none") {
            el.removeAttribute("style");
          } else {
            el.style.removeProperty("display");
          }
        });
      };
    let hide = () => {
      el._x_doHide();
      el._x_isShown = false;
    };
    let show = () => {
      el._x_doShow();
      el._x_isShown = true;
    };
    let clickAwayCompatibleShow = () => setTimeout(show);
    let toggle = once((value) => value ? show() : hide(), (value) => {
      if (typeof el._x_toggleAndCascadeWithTransitions === "function") {
        el._x_toggleAndCascadeWithTransitions(el, value, show, hide);
      } else {
        value ? clickAwayCompatibleShow() : hide();
      }
    });
    let oldValue;
    let firstTime = true;
    effect3(() => evaluate2((value) => {
      if (!firstTime && value === oldValue)
        return;
      if (modifiers.includes("immediate"))
        value ? clickAwayCompatibleShow() : hide();
      toggle(value);
      oldValue = value;
      firstTime = false;
    }));
  });

  // packages/alpinejs/src/directives/x-for.js
  directive("for", (el, {expression}, {effect: effect3, cleanup: cleanup2}) => {
    let iteratorNames = parseForExpression(expression);
    let evaluateItems = evaluateLater(el, iteratorNames.items);
    let evaluateKey = evaluateLater(el, el._x_keyExpression || "index");
    el._x_prevKeys = [];
    el._x_lookup = {};
    effect3(() => loop(el, iteratorNames, evaluateItems, evaluateKey));
    cleanup2(() => {
      Object.values(el._x_lookup).forEach((el2) => el2.remove());
      delete el._x_prevKeys;
      delete el._x_lookup;
    });
  });
  function loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let isObject2 = (i) => typeof i === "object" && !Array.isArray(i);
    let templateEl = el;
    evaluateItems((items) => {
      if (isNumeric3(items) && items >= 0) {
        items = Array.from(Array(items).keys(), (i) => i + 1);
      }
      if (items === void 0)
        items = [];
      let lookup = el._x_lookup;
      let prevKeys = el._x_prevKeys;
      let scopes = [];
      let keys = [];
      if (isObject2(items)) {
        items = Object.entries(items).map(([key, value]) => {
          let scope2 = getIterationScopeVariables(iteratorNames, value, key, items);
          evaluateKey((value2) => keys.push(value2), {scope: {index: key, ...scope2}});
          scopes.push(scope2);
        });
      } else {
        for (let i = 0; i < items.length; i++) {
          let scope2 = getIterationScopeVariables(iteratorNames, items[i], i, items);
          evaluateKey((value) => keys.push(value), {scope: {index: i, ...scope2}});
          scopes.push(scope2);
        }
      }
      let adds = [];
      let moves = [];
      let removes = [];
      let sames = [];
      for (let i = 0; i < prevKeys.length; i++) {
        let key = prevKeys[i];
        if (keys.indexOf(key) === -1)
          removes.push(key);
      }
      prevKeys = prevKeys.filter((key) => !removes.includes(key));
      let lastKey = "template";
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let prevIndex = prevKeys.indexOf(key);
        if (prevIndex === -1) {
          prevKeys.splice(i, 0, key);
          adds.push([lastKey, i]);
        } else if (prevIndex !== i) {
          let keyInSpot = prevKeys.splice(i, 1)[0];
          let keyForSpot = prevKeys.splice(prevIndex - 1, 1)[0];
          prevKeys.splice(i, 0, keyForSpot);
          prevKeys.splice(prevIndex, 0, keyInSpot);
          moves.push([keyInSpot, keyForSpot]);
        } else {
          sames.push(key);
        }
        lastKey = key;
      }
      for (let i = 0; i < removes.length; i++) {
        let key = removes[i];
        if (!!lookup[key]._x_effects) {
          lookup[key]._x_effects.forEach(dequeueJob);
        }
        lookup[key].remove();
        lookup[key] = null;
        delete lookup[key];
      }
      for (let i = 0; i < moves.length; i++) {
        let [keyInSpot, keyForSpot] = moves[i];
        let elInSpot = lookup[keyInSpot];
        let elForSpot = lookup[keyForSpot];
        let marker = document.createElement("div");
        mutateDom(() => {
          if (!elForSpot)
            warn(`x-for ":key" is undefined or invalid`, templateEl);
          elForSpot.after(marker);
          elInSpot.after(elForSpot);
          elForSpot._x_currentIfEl && elForSpot.after(elForSpot._x_currentIfEl);
          marker.before(elInSpot);
          elInSpot._x_currentIfEl && elInSpot.after(elInSpot._x_currentIfEl);
          marker.remove();
        });
        elForSpot._x_refreshXForScope(scopes[keys.indexOf(keyForSpot)]);
      }
      for (let i = 0; i < adds.length; i++) {
        let [lastKey2, index] = adds[i];
        let lastEl = lastKey2 === "template" ? templateEl : lookup[lastKey2];
        if (lastEl._x_currentIfEl)
          lastEl = lastEl._x_currentIfEl;
        let scope2 = scopes[index];
        let key = keys[index];
        let clone2 = document.importNode(templateEl.content, true).firstElementChild;
        let reactiveScope = reactive(scope2);
        addScopeToNode(clone2, reactiveScope, templateEl);
        clone2._x_refreshXForScope = (newScope) => {
          Object.entries(newScope).forEach(([key2, value]) => {
            reactiveScope[key2] = value;
          });
        };
        mutateDom(() => {
          lastEl.after(clone2);
          initTree(clone2);
        });
        if (typeof key === "object") {
          warn("x-for key cannot be an object, it must be a string or an integer", templateEl);
        }
        lookup[key] = clone2;
      }
      for (let i = 0; i < sames.length; i++) {
        lookup[sames[i]]._x_refreshXForScope(scopes[keys.indexOf(sames[i])]);
      }
      templateEl._x_prevKeys = keys;
    });
  }
  function parseForExpression(expression) {
    let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
    let stripParensRE = /^\s*\(|\)\s*$/g;
    let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
    let inMatch = expression.match(forAliasRE);
    if (!inMatch)
      return;
    let res = {};
    res.items = inMatch[2].trim();
    let item = inMatch[1].replace(stripParensRE, "").trim();
    let iteratorMatch = item.match(forIteratorRE);
    if (iteratorMatch) {
      res.item = item.replace(forIteratorRE, "").trim();
      res.index = iteratorMatch[1].trim();
      if (iteratorMatch[2]) {
        res.collection = iteratorMatch[2].trim();
      }
    } else {
      res.item = item;
    }
    return res;
  }
  function getIterationScopeVariables(iteratorNames, item, index, items) {
    let scopeVariables = {};
    if (/^\[.*\]$/.test(iteratorNames.item) && Array.isArray(item)) {
      let names = iteratorNames.item.replace("[", "").replace("]", "").split(",").map((i) => i.trim());
      names.forEach((name, i) => {
        scopeVariables[name] = item[i];
      });
    } else if (/^\{.*\}$/.test(iteratorNames.item) && !Array.isArray(item) && typeof item === "object") {
      let names = iteratorNames.item.replace("{", "").replace("}", "").split(",").map((i) => i.trim());
      names.forEach((name) => {
        scopeVariables[name] = item[name];
      });
    } else {
      scopeVariables[iteratorNames.item] = item;
    }
    if (iteratorNames.index)
      scopeVariables[iteratorNames.index] = index;
    if (iteratorNames.collection)
      scopeVariables[iteratorNames.collection] = items;
    return scopeVariables;
  }
  function isNumeric3(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }

  // packages/alpinejs/src/directives/x-ref.js
  function handler3() {
  }
  handler3.inline = (el, {expression}, {cleanup: cleanup2}) => {
    let root = closestRoot(el);
    if (!root._x_refs)
      root._x_refs = {};
    root._x_refs[expression] = el;
    cleanup2(() => delete root._x_refs[expression]);
  };
  directive("ref", handler3);

  // packages/alpinejs/src/directives/x-if.js
  directive("if", (el, {expression}, {effect: effect3, cleanup: cleanup2}) => {
    let evaluate2 = evaluateLater(el, expression);
    let show = () => {
      if (el._x_currentIfEl)
        return el._x_currentIfEl;
      let clone2 = el.content.cloneNode(true).firstElementChild;
      addScopeToNode(clone2, {}, el);
      mutateDom(() => {
        el.after(clone2);
        initTree(clone2);
      });
      el._x_currentIfEl = clone2;
      el._x_undoIf = () => {
        walk(clone2, (node) => {
          if (!!node._x_effects) {
            node._x_effects.forEach(dequeueJob);
          }
        });
        clone2.remove();
        delete el._x_currentIfEl;
      };
      return clone2;
    };
    let hide = () => {
      if (!el._x_undoIf)
        return;
      el._x_undoIf();
      delete el._x_undoIf;
    };
    effect3(() => evaluate2((value) => {
      value ? show() : hide();
    }));
    cleanup2(() => el._x_undoIf && el._x_undoIf());
  });

  // packages/alpinejs/src/directives/x-id.js
  directive("id", (el, {expression}, {evaluate: evaluate2}) => {
    let names = evaluate2(expression);
    names.forEach((name) => setIdRoot(el, name));
  });

  // packages/alpinejs/src/directives/x-on.js
  mapAttributes(startingWith("@", into(prefix$1("on:"))));
  directive("on", skipDuringClone((el, {value, modifiers, expression}, {cleanup: cleanup2}) => {
    let evaluate2 = expression ? evaluateLater(el, expression) : () => {
    };
    if (el.tagName.toLowerCase() === "template") {
      if (!el._x_forwardEvents)
        el._x_forwardEvents = [];
      if (!el._x_forwardEvents.includes(value))
        el._x_forwardEvents.push(value);
    }
    let removeListener = on(el, value, modifiers, (e) => {
      evaluate2(() => {
      }, {scope: {$event: e}, params: [e]});
    });
    cleanup2(() => removeListener());
  }));

  // packages/alpinejs/src/directives/index.js
  warnMissingPluginDirective("Collapse", "collapse", "collapse");
  warnMissingPluginDirective("Intersect", "intersect", "intersect");
  warnMissingPluginDirective("Focus", "trap", "focus");
  warnMissingPluginDirective("Mask", "mask", "mask");
  function warnMissingPluginDirective(name, directiveName2, slug) {
    directive(directiveName2, (el) => warn(`You can't use [x-${directiveName2}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`, el));
  }

  // packages/alpinejs/src/index.js
  alpine_default.setEvaluator(normalEvaluator);
  alpine_default.setReactivityEngine({reactive: reactive2, effect: effect2, release: stop, raw: toRaw});
  var src_default = alpine_default;

  // packages/alpinejs/builds/module.js
  var module_default = src_default;

  function Accordion(Alpine) {
    Alpine.directive("accordion", (el) => {
      Alpine.bind(el, {
        "u-id"() {
          return ["accordion"];
        },
      });
    });

    
    Alpine.directive("accordion-header", (el) => {
      Alpine.bind(el, {
        "u-bind:id"() {
          return this.$id("accordion");
        },
        "u-on:click"() {
          this.$data.toggle(this.$id("accordion"));
        },
        "u-bind:u-accordion-header-open"() {
          return this.$data.isOpen(this.$id("accordion"));
        },
      });
    });

    Alpine.directive("accordion-content", (el) => {
      Alpine.bind(el, {
        "u-bind:id"() {
          return this.$id("accordion");
        },
        "u-bind:u-accordion-content-open"() {
          return this.$data.isOpen(this.$id("accordion"));
        },
      });
    });

    Alpine.directive("accordions", (el) => {
      Alpine.bind(el, {
        "u-data"() {
          return {
            open: {},
            persistent: el.getAttribute("persistent"),
            toggle: (id) => {
              if (this.$data.persistent) {
                console.log("persistent", "close others");
              }
              if (this.$data.open[id]) {
                delete this.$data.open[id];
              } else {
                this.$data.open[id] = true;
              }
            },
            isOpen(id) {
              return this.$data.open[id];
            },
          };
        },
      });
    });
  }

  function Icon$1(Alpine) {
    Alpine.directive("icon", (el) => {
      const iconName = el.textContent;

      const name = el.getAttribute("name");

      async function setIcon(value) {
        try {
          const res = await fetch(
            `https://unpkg.com/@tabler/icons@2.19.0/icons/${value}.svg`
          );
          const svg = await res.text();

          if (svg.indexOf("Cannot") > -1) {
            el.innerHTML = "";
            // console.log('icon not loaded', value)
          } else {
            el.innerHTML = svg;
          }
        } catch (err) {
          el.innerHTML = "";
          //
        }
      }

      if (name) {
        Alpine.bind(el, {
          "u-model": name,
          "u-init"() {
            this.$watch(name, (value) => setIcon(value));
          },
        });
      } else {
        Alpine.bind(el, {
          "u-init"() {
            setIcon(iconName);
          },
        });
      }
    });
  }

  function Form(Alpine) {
    const handlers = {
      input: (el) => ({
        name: el.name,
        get: () => el.value,
        set: (value) => (el.value = value),
      }),
      checkbox: (el) => {
        const checkbox = el.querySelector("[u-checkbox-input]");

        return {
          name: checkbox.name,
          get: () => checkbox.checked,
          set: (value) => (checkbox.checked = value),
        };
      },
      switch: (el) => {
        const switchEl = el.querySelector("[u-switch-input]");

        return {
          name: switchEl.name,
          get: () => switchEl.checked,
          set: (value) => (switchEl.checked = value),
        };
      },
      "checkbox-group": (el) => {
        // el._model.get
        const name = el.getAttribute("name");

        return {
          name,
          get: () => {
            let value = [];

            el.querySelectorAll("[u-checkbox-group-item-input]").forEach(
              (item) => {
                if (item.checked) {
                  value = [...value, item.value];
                }
              }
            );

            return value;
          },
          set(value) {
            console.log("set value of checkbox group to", value);

            el.querySelectorAll("[u-checkbox-group-item-input]").forEach(
              (item) => {
                if (value.includes(item.value)) {
                  item.checked = true;
                } else {
                  item.checked = false;
                }
              }
            );
          },
        };
      },
      "radio-group": (el) => {
        const name = el.getAttribute("name");

        return {
          name,
          get: () => {
            let value = "";

            el.querySelectorAll("[u-radio-group-item-input]").forEach((item) => {
              if (item.checked) {
                value = item.value;
              }
            });
            return value;
          },
          set: (value) => {
            el.querySelectorAll("[u-radio-group-item-input]").forEach((item) => {
              console.log("radio group", item.value, value);
              if (item.value === value) {
                item.checked = true;
              }
            });
          },
        };
      },
      select: (el) => {
        const name = el.getAttribute("name");
        const multiple = el.getAttribute("multiple");

        return {
          name,
          get() {
            if (multiple) {
              const selected = Array.from(el.selectedOptions)
                .map((option) => option.value)
                .filter((x) => !!x);

              return selected;
            } else {
              const selected = el.selectedOptions[0];

              console.log(selected);
              if (selected) return selected.value;
              return undefined;
            }
          },
          set(value) {
            console.log("set value of select to", value);
            if (Array.isArray(value)) {
              Array.from(el.options).map((option) => {
                if (value.includes(option.value)) option.selected = true;
                else option.selected = false;
              });
            } else {
              el.value = value;
            }
          },
        };
      },
      textarea(el) {
        const name = el.getAttribute("name");

        return {
          name,
          get: () => el.value,
          set: (value) => (el.value = value),
        };
      },
    };

    Alpine.directive("form", (el, {}, {evaluateLater}) => {
      let actionFn;

      let method = el.getAttribute('method');
   
      if(method === 'FUNCTION') {
        actionFn = evaluateLater(el.getAttribute('action'));
        // console.log(actionFn(el, el, value))
        
      }

      const fields = {};

      const formValue = JSON.parse(el.getAttribute("value") ?? "{}");

      for (let input in handlers) {
        el.querySelectorAll(`[u-${input}]`).forEach((el) => {
          const { name, get, set } = handlers[input](el);

          if (typeof formValue[name] !== "undefined") {
            set(formValue[name]);
          }

          fields[name] = { get, set };
        });
      }

      Alpine.bind(el, {
        "u-data"() {
          let result = {};

          for (let field in fields) {
            result[field] = fields[field].get();
          }
          return result;
        },
      });

      Alpine.bind(el, {
        async "u-on:submit"(event) {
          const value = {};
          event.preventDefault();

          Object.keys(fields).map((key) => {
            value[key] = fields[key].get();
          });

          if (el.getAttribute("method") === "FUNCTION") {          

            await actionFn((v) => v, { scope: { '$value': value }, params: [value] });

          } else {
            const pathname = window.location.pathname;

            const url = pathname.endsWith("/")
              ? pathname.substring(0, pathname.length - 1)
              : pathname + "?" + el.getAttribute("action");

            try {
              const result = await fetch(url, {
                method: "POST", // el.method,
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(value),
              }).then((res) => res.json());

              console.log({ result });
            } catch (err) {
              console.log(err);
            }
          }
        },
      });
    });


    Alpine.magic('post', (el) => {
      return async (pathname, data = {}, headers = {}) => {
        const result = await fetch(pathname, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        }).then(res => res.json());

        return result;
      }
    });

    Alpine.magic('get', (el) => {
      return async (pathname) => {
        const result = await fetch(pathname, {
          method: 'GET',
        }).then(res => res.json());

        return result;
      }
    });
  }

  /**
  * Tom Select v2.2.2
  * Licensed under the Apache License, Version 2.0 (the "License");
  */

  /**
   * MicroEvent - to make any js object an event emitter
   *
   * - pure javascript - server compatible, browser compatible
   * - dont rely on the browser doms
   * - super simple - you get it immediatly, no mistery, no magic involved
   *
   * @author Jerome Etienne (https://github.com/jeromeetienne)
   */

  /**
   * Execute callback for each event in space separated list of event names
   *
   */
  function forEvents(events, callback) {
    events.split(/\s+/).forEach(event => {
      callback(event);
    });
  }

  class MicroEvent {
    constructor() {
      this._events = void 0;
      this._events = {};
    }

    on(events, fct) {
      forEvents(events, event => {
        const event_array = this._events[event] || [];
        event_array.push(fct);
        this._events[event] = event_array;
      });
    }

    off(events, fct) {
      var n = arguments.length;

      if (n === 0) {
        this._events = {};
        return;
      }

      forEvents(events, event => {
        if (n === 1) {
          delete this._events[event];
          return;
        }

        const event_array = this._events[event];
        if (event_array === undefined) return;
        event_array.splice(event_array.indexOf(fct), 1);
        this._events[event] = event_array;
      });
    }

    trigger(events, ...args) {
      var self = this;
      forEvents(events, event => {
        const event_array = self._events[event];
        if (event_array === undefined) return;
        event_array.forEach(fct => {
          fct.apply(self, args);
        });
      });
    }

  }

  /**
   * microplugin.js
   * Copyright (c) 2013 Brian Reavis & contributors
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   * @author Brian Reavis <brian@thirdroute.com>
   */
  function MicroPlugin(Interface) {
    Interface.plugins = {};
    return class extends Interface {
      constructor(...args) {
        super(...args);
        this.plugins = {
          names: [],
          settings: {},
          requested: {},
          loaded: {}
        };
      }

      /**
       * Registers a plugin.
       *
       * @param {function} fn
       */
      static define(name, fn) {
        Interface.plugins[name] = {
          'name': name,
          'fn': fn
        };
      }
      /**
       * Initializes the listed plugins (with options).
       * Acceptable formats:
       *
       * List (without options):
       *   ['a', 'b', 'c']
       *
       * List (with options):
       *   [{'name': 'a', options: {}}, {'name': 'b', options: {}}]
       *
       * Hash (with options):
       *   {'a': { ... }, 'b': { ... }, 'c': { ... }}
       *
       * @param {array|object} plugins
       */


      initializePlugins(plugins) {
        var key, name;
        const self = this;
        const queue = [];

        if (Array.isArray(plugins)) {
          plugins.forEach(plugin => {
            if (typeof plugin === 'string') {
              queue.push(plugin);
            } else {
              self.plugins.settings[plugin.name] = plugin.options;
              queue.push(plugin.name);
            }
          });
        } else if (plugins) {
          for (key in plugins) {
            if (plugins.hasOwnProperty(key)) {
              self.plugins.settings[key] = plugins[key];
              queue.push(key);
            }
          }
        }

        while (name = queue.shift()) {
          self.require(name);
        }
      }

      loadPlugin(name) {
        var self = this;
        var plugins = self.plugins;
        var plugin = Interface.plugins[name];

        if (!Interface.plugins.hasOwnProperty(name)) {
          throw new Error('Unable to find "' + name + '" plugin');
        }

        plugins.requested[name] = true;
        plugins.loaded[name] = plugin.fn.apply(self, [self.plugins.settings[name] || {}]);
        plugins.names.push(name);
      }
      /**
       * Initializes a plugin.
       *
       */


      require(name) {
        var self = this;
        var plugins = self.plugins;

        if (!self.plugins.loaded.hasOwnProperty(name)) {
          if (plugins.requested[name]) {
            throw new Error('Plugin has circular dependency ("' + name + '")');
          }

          self.loadPlugin(name);
        }

        return plugins.loaded[name];
      }

    };
  }

  /*! @orchidjs/unicode-variants | https://github.com/orchidjs/unicode-variants | Apache License (v2) */
  /**
   * Convert array of strings to a regular expression
   *	ex ['ab','a'] => (?:ab|a)
   * 	ex ['a','b'] => [ab]
   * @param {string[]} chars
   * @return {string}
   */
  const arrayToPattern = chars => {
    chars = chars.filter(Boolean);

    if (chars.length < 2) {
      return chars[0] || '';
    }

    return maxValueLength(chars) == 1 ? '[' + chars.join('') + ']' : '(?:' + chars.join('|') + ')';
  };
  /**
   * @param {string[]} array
   * @return {string}
   */

  const sequencePattern = array => {
    if (!hasDuplicates(array)) {
      return array.join('');
    }

    let pattern = '';
    let prev_char_count = 0;

    const prev_pattern = () => {
      if (prev_char_count > 1) {
        pattern += '{' + prev_char_count + '}';
      }
    };

    array.forEach((char, i) => {
      if (char === array[i - 1]) {
        prev_char_count++;
        return;
      }

      prev_pattern();
      pattern += char;
      prev_char_count = 1;
    });
    prev_pattern();
    return pattern;
  };
  /**
   * Convert array of strings to a regular expression
   *	ex ['ab','a'] => (?:ab|a)
   * 	ex ['a','b'] => [ab]
   * @param {Set<string>} chars
   * @return {string}
   */

  const setToPattern = chars => {
    let array = toArray(chars);
    return arrayToPattern(array);
  };
  /**
   *
   * https://stackoverflow.com/questions/7376598/in-javascript-how-do-i-check-if-an-array-has-duplicate-values
   * @param {any[]} array
   */

  const hasDuplicates = array => {
    return new Set(array).size !== array.length;
  };
  /**
   * https://stackoverflow.com/questions/63006601/why-does-u-throw-an-invalid-escape-error
   * @param {string} str
   * @return {string}
   */

  const escape_regex = str => {
    return (str + '').replace(/([\$\(\)\*\+\.\?\[\]\^\{\|\}\\])/gu, '\\$1');
  };
  /**
   * Return the max length of array values
   * @param {string[]} array
   *
   */

  const maxValueLength = array => {
    return array.reduce((longest, value) => Math.max(longest, unicodeLength(value)), 0);
  };
  /**
   * @param {string} str
   */

  const unicodeLength = str => {
    return toArray(str).length;
  };
  /**
   * @param {any} p
   * @return {any[]}
   */

  const toArray = p => Array.from(p);

  /*! @orchidjs/unicode-variants | https://github.com/orchidjs/unicode-variants | Apache License (v2) */
  /**
   * Get all possible combinations of substrings that add up to the given string
   * https://stackoverflow.com/questions/30169587/find-all-the-combination-of-substrings-that-add-up-to-the-given-string
   * @param {string} input
   * @return {string[][]}
   */
  const allSubstrings = input => {
    if (input.length === 1) return [[input]];
    /** @type {string[][]} */

    let result = [];
    const start = input.substring(1);
    const suba = allSubstrings(start);
    suba.forEach(function (subresult) {
      let tmp = subresult.slice(0);
      tmp[0] = input.charAt(0) + tmp[0];
      result.push(tmp);
      tmp = subresult.slice(0);
      tmp.unshift(input.charAt(0));
      result.push(tmp);
    });
    return result;
  };

  /*! @orchidjs/unicode-variants | https://github.com/orchidjs/unicode-variants | Apache License (v2) */

  /**
   * @typedef {{[key:string]:string}} TUnicodeMap
   * @typedef {{[key:string]:Set<string>}} TUnicodeSets
   * @typedef {[[number,number]]} TCodePoints
   * @typedef {{folded:string,composed:string,code_point:number}} TCodePointObj
   * @typedef {{start:number,end:number,length:number,substr:string}} TSequencePart
   */
  /** @type {TCodePoints} */

  const code_points = [[0, 65535]];
  const accent_pat = '[\u0300-\u036F\u{b7}\u{2be}\u{2bc}]';
  /** @type {TUnicodeMap} */

  let unicode_map;
  /** @type {RegExp} */

  let multi_char_reg;
  const max_char_length = 3;
  /** @type {TUnicodeMap} */

  const latin_convert = {};
  /** @type {TUnicodeMap} */

  const latin_condensed = {
    '/': '⁄∕',
    '0': '߀',
    "a": "ⱥɐɑ",
    "aa": "ꜳ",
    "ae": "æǽǣ",
    "ao": "ꜵ",
    "au": "ꜷ",
    "av": "ꜹꜻ",
    "ay": "ꜽ",
    "b": "ƀɓƃ",
    "c": "ꜿƈȼↄ",
    "d": "đɗɖᴅƌꮷԁɦ",
    "e": "ɛǝᴇɇ",
    "f": "ꝼƒ",
    "g": "ǥɠꞡᵹꝿɢ",
    "h": "ħⱨⱶɥ",
    "i": "ɨı",
    "j": "ɉȷ",
    "k": "ƙⱪꝁꝃꝅꞣ",
    "l": "łƚɫⱡꝉꝇꞁɭ",
    "m": "ɱɯϻ",
    "n": "ꞥƞɲꞑᴎлԉ",
    "o": "øǿɔɵꝋꝍᴑ",
    "oe": "œ",
    "oi": "ƣ",
    "oo": "ꝏ",
    "ou": "ȣ",
    "p": "ƥᵽꝑꝓꝕρ",
    "q": "ꝗꝙɋ",
    "r": "ɍɽꝛꞧꞃ",
    "s": "ßȿꞩꞅʂ",
    "t": "ŧƭʈⱦꞇ",
    "th": "þ",
    "tz": "ꜩ",
    "u": "ʉ",
    "v": "ʋꝟʌ",
    "vy": "ꝡ",
    "w": "ⱳ",
    "y": "ƴɏỿ",
    "z": "ƶȥɀⱬꝣ",
    "hv": "ƕ"
  };

  for (let latin in latin_condensed) {
    let unicode = latin_condensed[latin] || '';

    for (let i = 0; i < unicode.length; i++) {
      let char = unicode.substring(i, i + 1);
      latin_convert[char] = latin;
    }
  }

  const convert_pat = new RegExp(Object.keys(latin_convert).join('|') + '|' + accent_pat, 'gu');
  /**
   * Initialize the unicode_map from the give code point ranges
   *
   * @param {TCodePoints=} _code_points
   */

  const initialize = _code_points => {
    if (unicode_map !== undefined) return;
    unicode_map = generateMap(_code_points || code_points);
  };
  /**
   * Helper method for normalize a string
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
   * @param {string} str
   * @param {string} form
   */

  const normalize = (str, form = 'NFKD') => str.normalize(form);
  /**
   * Remove accents without reordering string
   * calling str.normalize('NFKD') on \u{594}\u{595}\u{596} becomes \u{596}\u{594}\u{595}
   * via https://github.com/krisk/Fuse/issues/133#issuecomment-318692703
   * @param {string} str
   * @return {string}
   */

  const asciifold = str => {
    return toArray(str).reduce(
    /**
     * @param {string} result
     * @param {string} char
     */
    (result, char) => {
      return result + _asciifold(char);
    }, '');
  };
  /**
   * @param {string} str
   * @return {string}
   */

  const _asciifold = str => {
    str = normalize(str).toLowerCase().replace(convert_pat, (
    /** @type {string} */
    char) => {
      return latin_convert[char] || '';
    }); //return str;

    return normalize(str, 'NFC');
  };
  /**
   * Generate a list of unicode variants from the list of code points
   * @param {TCodePoints} code_points
   * @yield {TCodePointObj}
   */

  function* generator(code_points) {
    for (const [code_point_min, code_point_max] of code_points) {
      for (let i = code_point_min; i <= code_point_max; i++) {
        let composed = String.fromCharCode(i);
        let folded = asciifold(composed);

        if (folded == composed.toLowerCase()) {
          continue;
        } // skip when folded is a string longer than 3 characters long
        // bc the resulting regex patterns will be long
        // eg:
        // folded صلى الله عليه وسلم length 18 code point 65018
        // folded جل جلاله length 8 code point 65019


        if (folded.length > max_char_length) {
          continue;
        }

        if (folded.length == 0) {
          continue;
        }

        yield {
          folded: folded,
          composed: composed,
          code_point: i
        };
      }
    }
  }
  /**
   * Generate a unicode map from the list of code points
   * @param {TCodePoints} code_points
   * @return {TUnicodeSets}
   */

  const generateSets = code_points => {
    /** @type {{[key:string]:Set<string>}} */
    const unicode_sets = {};
    /**
     * @param {string} folded
     * @param {string} to_add
     */

    const addMatching = (folded, to_add) => {
      /** @type {Set<string>} */
      const folded_set = unicode_sets[folded] || new Set();
      const patt = new RegExp('^' + setToPattern(folded_set) + '$', 'iu');

      if (to_add.match(patt)) {
        return;
      }

      folded_set.add(escape_regex(to_add));
      unicode_sets[folded] = folded_set;
    };

    for (let value of generator(code_points)) {
      addMatching(value.folded, value.folded);
      addMatching(value.folded, value.composed);
    }

    return unicode_sets;
  };
  /**
   * Generate a unicode map from the list of code points
   * ae => (?:(?:ae|Æ|Ǽ|Ǣ)|(?:A|Ⓐ|Ａ...)(?:E|ɛ|Ⓔ...))
   *
   * @param {TCodePoints} code_points
   * @return {TUnicodeMap}
   */

  const generateMap = code_points => {
    /** @type {TUnicodeSets} */
    const unicode_sets = generateSets(code_points);
    /** @type {TUnicodeMap} */

    const unicode_map = {};
    /** @type {string[]} */

    let multi_char = [];

    for (let folded in unicode_sets) {
      let set = unicode_sets[folded];

      if (set) {
        unicode_map[folded] = setToPattern(set);
      }

      if (folded.length > 1) {
        multi_char.push(escape_regex(folded));
      }
    }

    multi_char.sort((a, b) => b.length - a.length);
    const multi_char_patt = arrayToPattern(multi_char);
    multi_char_reg = new RegExp('^' + multi_char_patt, 'u');
    return unicode_map;
  };
  /**
   * Map each element of an array from it's folded value to all possible unicode matches
   * @param {string[]} strings
   * @param {number} min_replacement
   * @return {string}
   */

  const mapSequence = (strings, min_replacement = 1) => {
    let chars_replaced = 0;
    strings = strings.map(str => {
      if (unicode_map[str]) {
        chars_replaced += str.length;
      }

      return unicode_map[str] || str;
    });

    if (chars_replaced >= min_replacement) {
      return sequencePattern(strings);
    }

    return '';
  };
  /**
   * Convert a short string and split it into all possible patterns
   * Keep a pattern only if min_replacement is met
   *
   * 'abc'
   * 		=> [['abc'],['ab','c'],['a','bc'],['a','b','c']]
   *		=> ['abc-pattern','ab-c-pattern'...]
   *
   *
   * @param {string} str
   * @param {number} min_replacement
   * @return {string}
   */

  const substringsToPattern = (str, min_replacement = 1) => {
    min_replacement = Math.max(min_replacement, str.length - 1);
    return arrayToPattern(allSubstrings(str).map(sub_pat => {
      return mapSequence(sub_pat, min_replacement);
    }));
  };
  /**
   * Convert an array of sequences into a pattern
   * [{start:0,end:3,length:3,substr:'iii'}...] => (?:iii...)
   *
   * @param {Sequence[]} sequences
   * @param {boolean} all
   */

  const sequencesToPattern = (sequences, all = true) => {
    let min_replacement = sequences.length > 1 ? 1 : 0;
    return arrayToPattern(sequences.map(sequence => {
      let seq = [];
      const len = all ? sequence.length() : sequence.length() - 1;

      for (let j = 0; j < len; j++) {
        seq.push(substringsToPattern(sequence.substrs[j] || '', min_replacement));
      }

      return sequencePattern(seq);
    }));
  };
  /**
   * Return true if the sequence is already in the sequences
   * @param {Sequence} needle_seq
   * @param {Sequence[]} sequences
   */


  const inSequences = (needle_seq, sequences) => {
    for (const seq of sequences) {
      if (seq.start != needle_seq.start || seq.end != needle_seq.end) {
        continue;
      }

      if (seq.substrs.join('') !== needle_seq.substrs.join('')) {
        continue;
      }

      let needle_parts = needle_seq.parts;
      /**
       * @param {TSequencePart} part
       */

      const filter = part => {
        for (const needle_part of needle_parts) {
          if (needle_part.start === part.start && needle_part.substr === part.substr) {
            return false;
          }

          if (part.length == 1 || needle_part.length == 1) {
            continue;
          } // check for overlapping parts
          // a = ['::=','==']
          // b = ['::','===']
          // a = ['r','sm']
          // b = ['rs','m']


          if (part.start < needle_part.start && part.end > needle_part.start) {
            return true;
          }

          if (needle_part.start < part.start && needle_part.end > part.start) {
            return true;
          }
        }

        return false;
      };

      let filtered = seq.parts.filter(filter);

      if (filtered.length > 0) {
        continue;
      }

      return true;
    }

    return false;
  };

  class Sequence {
    constructor() {
      /** @type {TSequencePart[]} */
      this.parts = [];
      /** @type {string[]} */

      this.substrs = [];
      this.start = 0;
      this.end = 0;
    }
    /**
     * @param {TSequencePart|undefined} part
     */


    add(part) {
      if (part) {
        this.parts.push(part);
        this.substrs.push(part.substr);
        this.start = Math.min(part.start, this.start);
        this.end = Math.max(part.end, this.end);
      }
    }

    last() {
      return this.parts[this.parts.length - 1];
    }

    length() {
      return this.parts.length;
    }
    /**
     * @param {number} position
     * @param {TSequencePart} last_piece
     */


    clone(position, last_piece) {
      let clone = new Sequence();
      let parts = JSON.parse(JSON.stringify(this.parts));
      let last_part = parts.pop();

      for (const part of parts) {
        clone.add(part);
      }

      let last_substr = last_piece.substr.substring(0, position - last_part.start);
      let clone_last_len = last_substr.length;
      clone.add({
        start: last_part.start,
        end: last_part.start + clone_last_len,
        length: clone_last_len,
        substr: last_substr
      });
      return clone;
    }

  }
  /**
   * Expand a regular expression pattern to include unicode variants
   * 	eg /a/ becomes /aⓐａẚàáâầấẫẩãāăằắẵẳȧǡäǟảåǻǎȁȃạậặḁąⱥɐɑAⒶＡÀÁÂẦẤẪẨÃĀĂẰẮẴẲȦǠÄǞẢÅǺǍȀȂẠẬẶḀĄȺⱯ/
   *
   * Issue:
   *  ﺊﺋ [ 'ﺊ = \\u{fe8a}', 'ﺋ = \\u{fe8b}' ]
   *	becomes:	ئئ [ 'ي = \\u{64a}', 'ٔ = \\u{654}', 'ي = \\u{64a}', 'ٔ = \\u{654}' ]
   *
   *	İĲ = IIJ = ⅡJ
   *
   * 	1/2/4
   *
   * @param {string} str
   * @return {string|undefined}
   */


  const getPattern = str => {
    initialize();
    str = asciifold(str);
    let pattern = '';
    let sequences = [new Sequence()];

    for (let i = 0; i < str.length; i++) {
      let substr = str.substring(i);
      let match = substr.match(multi_char_reg);
      const char = str.substring(i, i + 1);
      const match_str = match ? match[0] : null; // loop through sequences
      // add either the char or multi_match

      let overlapping = [];
      let added_types = new Set();

      for (const sequence of sequences) {
        const last_piece = sequence.last();

        if (!last_piece || last_piece.length == 1 || last_piece.end <= i) {
          // if we have a multi match
          if (match_str) {
            const len = match_str.length;
            sequence.add({
              start: i,
              end: i + len,
              length: len,
              substr: match_str
            });
            added_types.add('1');
          } else {
            sequence.add({
              start: i,
              end: i + 1,
              length: 1,
              substr: char
            });
            added_types.add('2');
          }
        } else if (match_str) {
          let clone = sequence.clone(i, last_piece);
          const len = match_str.length;
          clone.add({
            start: i,
            end: i + len,
            length: len,
            substr: match_str
          });
          overlapping.push(clone);
        } else {
          // don't add char
          // adding would create invalid patterns: 234 => [2,34,4]
          added_types.add('3');
        }
      } // if we have overlapping


      if (overlapping.length > 0) {
        // ['ii','iii'] before ['i','i','iii']
        overlapping = overlapping.sort((a, b) => {
          return a.length() - b.length();
        });

        for (let clone of overlapping) {
          // don't add if we already have an equivalent sequence
          if (inSequences(clone, sequences)) {
            continue;
          }

          sequences.push(clone);
        }

        continue;
      } // if we haven't done anything unique
      // clean up the patterns
      // helps keep patterns smaller
      // if str = 'r₨㎧aarss', pattern will be 446 instead of 655


      if (i > 0 && added_types.size == 1 && !added_types.has('3')) {
        pattern += sequencesToPattern(sequences, false);
        let new_seq = new Sequence();
        const old_seq = sequences[0];

        if (old_seq) {
          new_seq.add(old_seq.last());
        }

        sequences = [new_seq];
      }
    }

    pattern += sequencesToPattern(sequences, true);
    return pattern;
  };

  /*! sifter.js | https://github.com/orchidjs/sifter.js | Apache License (v2) */

  /**
   * A property getter resolving dot-notation
   * @param  {Object}  obj     The root object to fetch property on
   * @param  {String}  name    The optionally dotted property name to fetch
   * @return {Object}          The resolved property value
   */
  const getAttr$1 = (obj, name) => {
    if (!obj) return;
    return obj[name];
  };
  /**
   * A property getter resolving dot-notation
   * @param  {Object}  obj     The root object to fetch property on
   * @param  {String}  name    The optionally dotted property name to fetch
   * @return {Object}          The resolved property value
   */

  const getAttrNesting = (obj, name) => {
    if (!obj) return;
    var part,
        names = name.split(".");

    while ((part = names.shift()) && (obj = obj[part]));

    return obj;
  };
  /**
   * Calculates how close of a match the
   * given value is against a search token.
   *
   */

  const scoreValue = (value, token, weight) => {
    var score, pos;
    if (!value) return 0;
    value = value + '';
    if (token.regex == null) return 0;
    pos = value.search(token.regex);
    if (pos === -1) return 0;
    score = token.string.length / value.length;
    if (pos === 0) score += 0.5;
    return score * weight;
  };
  /**
   * Cast object property to an array if it exists and has a value
   *
   */

  const propToArray = (obj, key) => {
    var value = obj[key];
    if (typeof value == 'function') return value;

    if (value && !Array.isArray(value)) {
      obj[key] = [value];
    }
  };
  /**
   * Iterates over arrays and hashes.
   *
   * ```
   * iterate(this.items, function(item, id) {
   *    // invoked for each item
   * });
   * ```
   *
   */

  const iterate$1 = (object, callback) => {
    if (Array.isArray(object)) {
      object.forEach(callback);
    } else {
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          callback(object[key], key);
        }
      }
    }
  };
  const cmp = (a, b) => {
    if (typeof a === 'number' && typeof b === 'number') {
      return a > b ? 1 : a < b ? -1 : 0;
    }

    a = asciifold(a + '').toLowerCase();
    b = asciifold(b + '').toLowerCase();
    if (a > b) return 1;
    if (b > a) return -1;
    return 0;
  };

  /*! sifter.js | https://github.com/orchidjs/sifter.js | Apache License (v2) */

  /**
   * sifter.js
   * Copyright (c) 2013–2020 Brian Reavis & contributors
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   * @author Brian Reavis <brian@thirdroute.com>
   */

  class Sifter {
    // []|{};

    /**
     * Textually searches arrays and hashes of objects
     * by property (or multiple properties). Designed
     * specifically for autocomplete.
     *
     */
    constructor(items, settings) {
      this.items = void 0;
      this.settings = void 0;
      this.items = items;
      this.settings = settings || {
        diacritics: true
      };
    }

    /**
     * Splits a search string into an array of individual
     * regexps to be used to match results.
     *
     */
    tokenize(query, respect_word_boundaries, weights) {
      if (!query || !query.length) return [];
      const tokens = [];
      const words = query.split(/\s+/);
      var field_regex;

      if (weights) {
        field_regex = new RegExp('^(' + Object.keys(weights).map(escape_regex).join('|') + ')\:(.*)$');
      }

      words.forEach(word => {
        let field_match;
        let field = null;
        let regex = null; // look for "field:query" tokens

        if (field_regex && (field_match = word.match(field_regex))) {
          field = field_match[1];
          word = field_match[2];
        }

        if (word.length > 0) {
          if (this.settings.diacritics) {
            regex = getPattern(word) || null;
          } else {
            regex = escape_regex(word);
          }

          if (regex && respect_word_boundaries) regex = "\\b" + regex;
        }

        tokens.push({
          string: word,
          regex: regex ? new RegExp(regex, 'iu') : null,
          field: field
        });
      });
      return tokens;
    }

    /**
     * Returns a function to be used to score individual results.
     *
     * Good matches will have a higher score than poor matches.
     * If an item is not a match, 0 will be returned by the function.
     *
     * @returns {T.ScoreFn}
     */
    getScoreFunction(query, options) {
      var search = this.prepareSearch(query, options);
      return this._getScoreFunction(search);
    }
    /**
     * @returns {T.ScoreFn}
     *
     */


    _getScoreFunction(search) {
      const tokens = search.tokens,
            token_count = tokens.length;

      if (!token_count) {
        return function () {
          return 0;
        };
      }

      const fields = search.options.fields,
            weights = search.weights,
            field_count = fields.length,
            getAttrFn = search.getAttrFn;

      if (!field_count) {
        return function () {
          return 1;
        };
      }
      /**
       * Calculates the score of an object
       * against the search query.
       *
       */


      const scoreObject = function () {
        if (field_count === 1) {
          return function (token, data) {
            const field = fields[0].field;
            return scoreValue(getAttrFn(data, field), token, weights[field] || 1);
          };
        }

        return function (token, data) {
          var sum = 0; // is the token specific to a field?

          if (token.field) {
            const value = getAttrFn(data, token.field);

            if (!token.regex && value) {
              sum += 1 / field_count;
            } else {
              sum += scoreValue(value, token, 1);
            }
          } else {
            iterate$1(weights, (weight, field) => {
              sum += scoreValue(getAttrFn(data, field), token, weight);
            });
          }

          return sum / field_count;
        };
      }();

      if (token_count === 1) {
        return function (data) {
          return scoreObject(tokens[0], data);
        };
      }

      if (search.options.conjunction === 'and') {
        return function (data) {
          var score,
              sum = 0;

          for (let token of tokens) {
            score = scoreObject(token, data);
            if (score <= 0) return 0;
            sum += score;
          }

          return sum / token_count;
        };
      } else {
        return function (data) {
          var sum = 0;
          iterate$1(tokens, token => {
            sum += scoreObject(token, data);
          });
          return sum / token_count;
        };
      }
    }

    /**
     * Returns a function that can be used to compare two
     * results, for sorting purposes. If no sorting should
     * be performed, `null` will be returned.
     *
     * @return function(a,b)
     */
    getSortFunction(query, options) {
      var search = this.prepareSearch(query, options);
      return this._getSortFunction(search);
    }

    _getSortFunction(search) {
      var implicit_score,
          sort_flds = [];
      const self = this,
            options = search.options,
            sort = !search.query && options.sort_empty ? options.sort_empty : options.sort;

      if (typeof sort == 'function') {
        return sort.bind(this);
      }
      /**
       * Fetches the specified sort field value
       * from a search result item.
       *
       */


      const get_field = function get_field(name, result) {
        if (name === '$score') return result.score;
        return search.getAttrFn(self.items[result.id], name);
      }; // parse options


      if (sort) {
        for (let s of sort) {
          if (search.query || s.field !== '$score') {
            sort_flds.push(s);
          }
        }
      } // the "$score" field is implied to be the primary
      // sort field, unless it's manually specified


      if (search.query) {
        implicit_score = true;

        for (let fld of sort_flds) {
          if (fld.field === '$score') {
            implicit_score = false;
            break;
          }
        }

        if (implicit_score) {
          sort_flds.unshift({
            field: '$score',
            direction: 'desc'
          });
        } // without a search.query, all items will have the same score

      } else {
        sort_flds = sort_flds.filter(fld => fld.field !== '$score');
      } // build function


      const sort_flds_count = sort_flds.length;

      if (!sort_flds_count) {
        return null;
      }

      return function (a, b) {
        var result, field;

        for (let sort_fld of sort_flds) {
          field = sort_fld.field;
          let multiplier = sort_fld.direction === 'desc' ? -1 : 1;
          result = multiplier * cmp(get_field(field, a), get_field(field, b));
          if (result) return result;
        }

        return 0;
      };
    }

    /**
     * Parses a search query and returns an object
     * with tokens and fields ready to be populated
     * with results.
     *
     */
    prepareSearch(query, optsUser) {
      const weights = {};
      var options = Object.assign({}, optsUser);
      propToArray(options, 'sort');
      propToArray(options, 'sort_empty'); // convert fields to new format

      if (options.fields) {
        propToArray(options, 'fields');
        const fields = [];
        options.fields.forEach(field => {
          if (typeof field == 'string') {
            field = {
              field: field,
              weight: 1
            };
          }

          fields.push(field);
          weights[field.field] = 'weight' in field ? field.weight : 1;
        });
        options.fields = fields;
      }

      return {
        options: options,
        query: query.toLowerCase().trim(),
        tokens: this.tokenize(query, options.respect_word_boundaries, weights),
        total: 0,
        items: [],
        weights: weights,
        getAttrFn: options.nesting ? getAttrNesting : getAttr$1
      };
    }

    /**
     * Searches through all items and returns a sorted array of matches.
     *
     */
    search(query, options) {
      var self = this,
          score,
          search;
      search = this.prepareSearch(query, options);
      options = search.options;
      query = search.query; // generate result scoring function

      const fn_score = options.score || self._getScoreFunction(search); // perform search and sort


      if (query.length) {
        iterate$1(self.items, (item, id) => {
          score = fn_score(item);

          if (options.filter === false || score > 0) {
            search.items.push({
              'score': score,
              'id': id
            });
          }
        });
      } else {
        iterate$1(self.items, (_, id) => {
          search.items.push({
            'score': 1,
            'id': id
          });
        });
      }

      const fn_sort = self._getSortFunction(search);

      if (fn_sort) search.items.sort(fn_sort); // apply limits

      search.total = search.items.length;

      if (typeof options.limit === 'number') {
        search.items = search.items.slice(0, options.limit);
      }

      return search;
    }

  }

  /**
   * Iterates over arrays and hashes.
   *
   * ```
   * iterate(this.items, function(item, id) {
   *    // invoked for each item
   * });
   * ```
   *
   */

  const iterate = (object, callback) => {
    if (Array.isArray(object)) {
      object.forEach(callback);
    } else {
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          callback(object[key], key);
        }
      }
    }
  };

  /**
   * Return a dom element from either a dom query string, jQuery object, a dom element or html string
   * https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
   *
   * param query should be {}
   */

  const getDom = query => {
    if (query.jquery) {
      return query[0];
    }

    if (query instanceof HTMLElement) {
      return query;
    }

    if (isHtmlString(query)) {
      var tpl = document.createElement('template');
      tpl.innerHTML = query.trim(); // Never return a text node of whitespace as the result

      return tpl.content.firstChild;
    }

    return document.querySelector(query);
  };
  const isHtmlString = arg => {
    if (typeof arg === 'string' && arg.indexOf('<') > -1) {
      return true;
    }

    return false;
  };
  const escapeQuery = query => {
    return query.replace(/['"\\]/g, '\\$&');
  };
  /**
   * Dispatch an event
   *
   */

  const triggerEvent = (dom_el, event_name) => {
    var event = document.createEvent('HTMLEvents');
    event.initEvent(event_name, true, false);
    dom_el.dispatchEvent(event);
  };
  /**
   * Apply CSS rules to a dom element
   *
   */

  const applyCSS = (dom_el, css) => {
    Object.assign(dom_el.style, css);
  };
  /**
   * Add css classes
   *
   */

  const addClasses = (elmts, ...classes) => {
    var norm_classes = classesArray(classes);
    elmts = castAsArray(elmts);
    elmts.map(el => {
      norm_classes.map(cls => {
        el.classList.add(cls);
      });
    });
  };
  /**
   * Remove css classes
   *
   */

  const removeClasses = (elmts, ...classes) => {
    var norm_classes = classesArray(classes);
    elmts = castAsArray(elmts);
    elmts.map(el => {
      norm_classes.map(cls => {
        el.classList.remove(cls);
      });
    });
  };
  /**
   * Return arguments
   *
   */

  const classesArray = args => {
    var classes = [];
    iterate(args, _classes => {
      if (typeof _classes === 'string') {
        _classes = _classes.trim().split(/[\11\12\14\15\40]/);
      }

      if (Array.isArray(_classes)) {
        classes = classes.concat(_classes);
      }
    });
    return classes.filter(Boolean);
  };
  /**
   * Create an array from arg if it's not already an array
   *
   */

  const castAsArray = arg => {
    if (!Array.isArray(arg)) {
      arg = [arg];
    }

    return arg;
  };
  /**
   * Get the closest node to the evt.target matching the selector
   * Stops at wrapper
   *
   */

  const parentMatch = (target, selector, wrapper) => {
    if (wrapper && !wrapper.contains(target)) {
      return;
    }

    while (target && target.matches) {
      if (target.matches(selector)) {
        return target;
      }

      target = target.parentNode;
    }
  };
  /**
   * Get the first or last item from an array
   *
   * > 0 - right (last)
   * <= 0 - left (first)
   *
   */

  const getTail = (list, direction = 0) => {
    if (direction > 0) {
      return list[list.length - 1];
    }

    return list[0];
  };
  /**
   * Return true if an object is empty
   *
   */

  const isEmptyObject = obj => {
    return Object.keys(obj).length === 0;
  };
  /**
   * Get the index of an element amongst sibling nodes of the same type
   *
   */

  const nodeIndex = (el, amongst) => {
    if (!el) return -1;
    amongst = amongst || el.nodeName;
    var i = 0;

    while (el = el.previousElementSibling) {
      if (el.matches(amongst)) {
        i++;
      }
    }

    return i;
  };
  /**
   * Set attributes of an element
   *
   */

  const setAttr$1 = (el, attrs) => {
    iterate(attrs, (val, attr) => {
      if (val == null) {
        el.removeAttribute(attr);
      } else {
        el.setAttribute(attr, '' + val);
      }
    });
  };
  /**
   * Replace a node
   */

  const replaceNode = (existing, replacement) => {
    if (existing.parentNode) existing.parentNode.replaceChild(replacement, existing);
  };

  /**
   * highlight v3 | MIT license | Johann Burkard <jb@eaio.com>
   * Highlights arbitrary terms in a node.
   *
   * - Modified by Marshal <beatgates@gmail.com> 2011-6-24 (added regex)
   * - Modified by Brian Reavis <brian@thirdroute.com> 2012-8-27 (cleanup)
   */
  const highlight = (element, regex) => {
    if (regex === null) return; // convet string to regex

    if (typeof regex === 'string') {
      if (!regex.length) return;
      regex = new RegExp(regex, 'i');
    } // Wrap matching part of text node with highlighting <span>, e.g.
    // Soccer  ->  <span class="highlight">Soc</span>cer  for regex = /soc/i


    const highlightText = node => {
      var match = node.data.match(regex);

      if (match && node.data.length > 0) {
        var spannode = document.createElement('span');
        spannode.className = 'highlight';
        var middlebit = node.splitText(match.index);
        middlebit.splitText(match[0].length);
        var middleclone = middlebit.cloneNode(true);
        spannode.appendChild(middleclone);
        replaceNode(middlebit, spannode);
        return 1;
      }

      return 0;
    }; // Recurse element node, looking for child text nodes to highlight, unless element
    // is childless, <script>, <style>, or already highlighted: <span class="hightlight">


    const highlightChildren = node => {
      if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName) && (node.className !== 'highlight' || node.tagName !== 'SPAN')) {
        Array.from(node.childNodes).forEach(element => {
          highlightRecursive(element);
        });
      }
    };

    const highlightRecursive = node => {
      if (node.nodeType === 3) {
        return highlightText(node);
      }

      highlightChildren(node);
      return 0;
    };

    highlightRecursive(element);
  };
  /**
   * removeHighlight fn copied from highlight v5 and
   * edited to remove with(), pass js strict mode, and use without jquery
   */

  const removeHighlight = el => {
    var elements = el.querySelectorAll("span.highlight");
    Array.prototype.forEach.call(elements, function (el) {
      var parent = el.parentNode;
      parent.replaceChild(el.firstChild, el);
      parent.normalize();
    });
  };

  const KEY_A = 65;
  const KEY_RETURN = 13;
  const KEY_ESC = 27;
  const KEY_LEFT = 37;
  const KEY_UP = 38;
  const KEY_RIGHT = 39;
  const KEY_DOWN = 40;
  const KEY_BACKSPACE = 8;
  const KEY_DELETE = 46;
  const KEY_TAB = 9;
  const IS_MAC = typeof navigator === 'undefined' ? false : /Mac/.test(navigator.userAgent);
  const KEY_SHORTCUT = IS_MAC ? 'metaKey' : 'ctrlKey'; // ctrl key or apple key for ma

  var defaults = {
    options: [],
    optgroups: [],
    plugins: [],
    delimiter: ',',
    splitOn: null,
    // regexp or string for splitting up values from a paste command
    persist: true,
    diacritics: true,
    create: null,
    createOnBlur: false,
    createFilter: null,
    highlight: true,
    openOnFocus: true,
    shouldOpen: null,
    maxOptions: 50,
    maxItems: null,
    hideSelected: null,
    duplicates: false,
    addPrecedence: false,
    selectOnTab: false,
    preload: null,
    allowEmptyOption: false,
    //closeAfterSelect: false,
    loadThrottle: 300,
    loadingClass: 'loading',
    dataAttr: null,
    //'data-data',
    optgroupField: 'optgroup',
    valueField: 'value',
    labelField: 'text',
    disabledField: 'disabled',
    optgroupLabelField: 'label',
    optgroupValueField: 'value',
    lockOptgroupOrder: false,
    sortField: '$order',
    searchField: ['text'],
    searchConjunction: 'and',
    mode: null,
    wrapperClass: 'ts-wrapper',
    controlClass: 'ts-control',
    dropdownClass: 'ts-dropdown',
    dropdownContentClass: 'ts-dropdown-content',
    itemClass: 'item',
    optionClass: 'option',
    dropdownParent: null,
    controlInput: '<input type="text" autocomplete="off" size="1" />',
    copyClassesToDropdown: false,
    placeholder: null,
    hidePlaceholder: null,
    shouldLoad: function (query) {
      return query.length > 0;
    },

    /*
    load                 : null, // function(query, callback) { ... }
    score                : null, // function(search) { ... }
    onInitialize         : null, // function() { ... }
    onChange             : null, // function(value) { ... }
    onItemAdd            : null, // function(value, $item) { ... }
    onItemRemove         : null, // function(value) { ... }
    onClear              : null, // function() { ... }
    onOptionAdd          : null, // function(value, data) { ... }
    onOptionRemove       : null, // function(value) { ... }
    onOptionClear        : null, // function() { ... }
    onOptionGroupAdd     : null, // function(id, data) { ... }
    onOptionGroupRemove  : null, // function(id) { ... }
    onOptionGroupClear   : null, // function() { ... }
    onDropdownOpen       : null, // function(dropdown) { ... }
    onDropdownClose      : null, // function(dropdown) { ... }
    onType               : null, // function(str) { ... }
    onDelete             : null, // function(values) { ... }
    */
    render: {
      /*
      item: null,
      optgroup: null,
      optgroup_header: null,
      option: null,
      option_create: null
      */
    }
  };

  /**
   * Converts a scalar to its best string representation
   * for hash keys and HTML attribute values.
   *
   * Transformations:
   *   'str'     -> 'str'
   *   null      -> ''
   *   undefined -> ''
   *   true      -> '1'
   *   false     -> '0'
   *   0         -> '0'
   *   1         -> '1'
   *
   */
  const hash_key = value => {
    if (typeof value === 'undefined' || value === null) return null;
    return get_hash(value);
  };
  const get_hash = value => {
    if (typeof value === 'boolean') return value ? '1' : '0';
    return value + '';
  };
  /**
   * Escapes a string for use within HTML.
   *
   */

  const escape_html = str => {
    return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  /**
   * Debounce the user provided load function
   *
   */

  const loadDebounce = (fn, delay) => {
    var timeout;
    return function (value, callback) {
      var self = this;

      if (timeout) {
        self.loading = Math.max(self.loading - 1, 0);
        clearTimeout(timeout);
      }

      timeout = setTimeout(function () {
        timeout = null;
        self.loadedSearches[value] = true;
        fn.call(self, value, callback);
      }, delay);
    };
  };
  /**
   * Debounce all fired events types listed in `types`
   * while executing the provided `fn`.
   *
   */

  const debounce_events = (self, types, fn) => {
    var type;
    var trigger = self.trigger;
    var event_args = {}; // override trigger method

    self.trigger = function () {
      var type = arguments[0];

      if (types.indexOf(type) !== -1) {
        event_args[type] = arguments;
      } else {
        return trigger.apply(self, arguments);
      }
    }; // invoke provided function


    fn.apply(self, []);
    self.trigger = trigger; // trigger queued events

    for (type of types) {
      if (type in event_args) {
        trigger.apply(self, event_args[type]);
      }
    }
  };
  /**
   * Determines the current selection within a text input control.
   * Returns an object containing:
   *   - start
   *   - length
   *
   */

  const getSelection = input => {
    return {
      start: input.selectionStart || 0,
      length: (input.selectionEnd || 0) - (input.selectionStart || 0)
    };
  };
  /**
   * Prevent default
   *
   */

  const preventDefault = (evt, stop = false) => {
    if (evt) {
      evt.preventDefault();

      if (stop) {
        evt.stopPropagation();
      }
    }
  };
  /**
   * Add event helper
   *
   */

  const addEvent = (target, type, callback, options) => {
    target.addEventListener(type, callback, options);
  };
  /**
   * Return true if the requested key is down
   * Will return false if more than one control character is pressed ( when [ctrl+shift+a] != [ctrl+a] )
   * The current evt may not always set ( eg calling advanceSelection() )
   *
   */

  const isKeyDown = (key_name, evt) => {
    if (!evt) {
      return false;
    }

    if (!evt[key_name]) {
      return false;
    }

    var count = (evt.altKey ? 1 : 0) + (evt.ctrlKey ? 1 : 0) + (evt.shiftKey ? 1 : 0) + (evt.metaKey ? 1 : 0);

    if (count === 1) {
      return true;
    }

    return false;
  };
  /**
   * Get the id of an element
   * If the id attribute is not set, set the attribute with the given id
   *
   */

  const getId = (el, id) => {
    const existing_id = el.getAttribute('id');

    if (existing_id) {
      return existing_id;
    }

    el.setAttribute('id', id);
    return id;
  };
  /**
   * Returns a string with backslashes added before characters that need to be escaped.
   */

  const addSlashes = str => {
    return str.replace(/[\\"']/g, '\\$&');
  };
  /**
   *
   */

  const append = (parent, node) => {
    if (node) parent.append(node);
  };

  function getSettings(input, settings_user) {
    var settings = Object.assign({}, defaults, settings_user);
    var attr_data = settings.dataAttr;
    var field_label = settings.labelField;
    var field_value = settings.valueField;
    var field_disabled = settings.disabledField;
    var field_optgroup = settings.optgroupField;
    var field_optgroup_label = settings.optgroupLabelField;
    var field_optgroup_value = settings.optgroupValueField;
    var tag_name = input.tagName.toLowerCase();
    var placeholder = input.getAttribute('placeholder') || input.getAttribute('data-placeholder');

    if (!placeholder && !settings.allowEmptyOption) {
      let option = input.querySelector('option[value=""]');

      if (option) {
        placeholder = option.textContent;
      }
    }

    var settings_element = {
      placeholder: placeholder,
      options: [],
      optgroups: [],
      items: [],
      maxItems: null
    };
    /**
     * Initialize from a <select> element.
     *
     */

    var init_select = () => {
      var tagName;
      var options = settings_element.options;
      var optionsMap = {};
      var group_count = 1;

      var readData = el => {
        var data = Object.assign({}, el.dataset); // get plain object from DOMStringMap

        var json = attr_data && data[attr_data];

        if (typeof json === 'string' && json.length) {
          data = Object.assign(data, JSON.parse(json));
        }

        return data;
      };

      var addOption = (option, group) => {
        var value = hash_key(option.value);
        if (value == null) return;
        if (!value && !settings.allowEmptyOption) return; // if the option already exists, it's probably been
        // duplicated in another optgroup. in this case, push
        // the current group to the "optgroup" property on the
        // existing option so that it's rendered in both places.

        if (optionsMap.hasOwnProperty(value)) {
          if (group) {
            var arr = optionsMap[value][field_optgroup];

            if (!arr) {
              optionsMap[value][field_optgroup] = group;
            } else if (!Array.isArray(arr)) {
              optionsMap[value][field_optgroup] = [arr, group];
            } else {
              arr.push(group);
            }
          }
        } else {
          var option_data = readData(option);
          option_data[field_label] = option_data[field_label] || option.textContent;
          option_data[field_value] = option_data[field_value] || value;
          option_data[field_disabled] = option_data[field_disabled] || option.disabled;
          option_data[field_optgroup] = option_data[field_optgroup] || group;
          option_data.$option = option;
          optionsMap[value] = option_data;
          options.push(option_data);
        }

        if (option.selected) {
          settings_element.items.push(value);
        }
      };

      var addGroup = optgroup => {
        var id, optgroup_data;
        optgroup_data = readData(optgroup);
        optgroup_data[field_optgroup_label] = optgroup_data[field_optgroup_label] || optgroup.getAttribute('label') || '';
        optgroup_data[field_optgroup_value] = optgroup_data[field_optgroup_value] || group_count++;
        optgroup_data[field_disabled] = optgroup_data[field_disabled] || optgroup.disabled;
        settings_element.optgroups.push(optgroup_data);
        id = optgroup_data[field_optgroup_value];
        iterate(optgroup.children, option => {
          addOption(option, id);
        });
      };

      settings_element.maxItems = input.hasAttribute('multiple') ? null : 1;
      iterate(input.children, child => {
        tagName = child.tagName.toLowerCase();

        if (tagName === 'optgroup') {
          addGroup(child);
        } else if (tagName === 'option') {
          addOption(child);
        }
      });
    };
    /**
     * Initialize from a <input type="text"> element.
     *
     */


    var init_textbox = () => {
      const data_raw = input.getAttribute(attr_data);

      if (!data_raw) {
        var value = input.value.trim() || '';
        if (!settings.allowEmptyOption && !value.length) return;
        const values = value.split(settings.delimiter);
        iterate(values, value => {
          const option = {};
          option[field_label] = value;
          option[field_value] = value;
          settings_element.options.push(option);
        });
        settings_element.items = values;
      } else {
        settings_element.options = JSON.parse(data_raw);
        iterate(settings_element.options, opt => {
          settings_element.items.push(opt[field_value]);
        });
      }
    };

    if (tag_name === 'select') {
      init_select();
    } else {
      init_textbox();
    }

    return Object.assign({}, defaults, settings_element, settings_user);
  }

  var instance_i = 0;
  class TomSelect extends MicroPlugin(MicroEvent) {
    // @deprecated 1.8
    constructor(input_arg, user_settings) {
      super();
      this.control_input = void 0;
      this.wrapper = void 0;
      this.dropdown = void 0;
      this.control = void 0;
      this.dropdown_content = void 0;
      this.focus_node = void 0;
      this.order = 0;
      this.settings = void 0;
      this.input = void 0;
      this.tabIndex = void 0;
      this.is_select_tag = void 0;
      this.rtl = void 0;
      this.inputId = void 0;
      this._destroy = void 0;
      this.sifter = void 0;
      this.isOpen = false;
      this.isDisabled = false;
      this.isRequired = void 0;
      this.isInvalid = false;
      this.isValid = true;
      this.isLocked = false;
      this.isFocused = false;
      this.isInputHidden = false;
      this.isSetup = false;
      this.ignoreFocus = false;
      this.ignoreHover = false;
      this.hasOptions = false;
      this.currentResults = void 0;
      this.lastValue = '';
      this.caretPos = 0;
      this.loading = 0;
      this.loadedSearches = {};
      this.activeOption = null;
      this.activeItems = [];
      this.optgroups = {};
      this.options = {};
      this.userOptions = {};
      this.items = [];
      instance_i++;
      var dir;
      var input = getDom(input_arg);

      if (input.tomselect) {
        throw new Error('Tom Select already initialized on this element');
      }

      input.tomselect = this; // detect rtl environment

      var computedStyle = window.getComputedStyle && window.getComputedStyle(input, null);
      dir = computedStyle.getPropertyValue('direction'); // setup default state

      const settings = getSettings(input, user_settings);
      this.settings = settings;
      this.input = input;
      this.tabIndex = input.tabIndex || 0;
      this.is_select_tag = input.tagName.toLowerCase() === 'select';
      this.rtl = /rtl/i.test(dir);
      this.inputId = getId(input, 'tomselect-' + instance_i);
      this.isRequired = input.required; // search system

      this.sifter = new Sifter(this.options, {
        diacritics: settings.diacritics
      }); // option-dependent defaults

      settings.mode = settings.mode || (settings.maxItems === 1 ? 'single' : 'multi');

      if (typeof settings.hideSelected !== 'boolean') {
        settings.hideSelected = settings.mode === 'multi';
      }

      if (typeof settings.hidePlaceholder !== 'boolean') {
        settings.hidePlaceholder = settings.mode !== 'multi';
      } // set up createFilter callback


      var filter = settings.createFilter;

      if (typeof filter !== 'function') {
        if (typeof filter === 'string') {
          filter = new RegExp(filter);
        }

        if (filter instanceof RegExp) {
          settings.createFilter = input => filter.test(input);
        } else {
          settings.createFilter = value => {
            return this.settings.duplicates || !this.options[value];
          };
        }
      }

      this.initializePlugins(settings.plugins);
      this.setupCallbacks();
      this.setupTemplates(); // Create all elements

      const wrapper = getDom('<div>');
      const control = getDom('<div>');

      const dropdown = this._render('dropdown');

      const dropdown_content = getDom(`<div role="listbox" tabindex="-1">`);
      const classes = this.input.getAttribute('class') || '';
      const inputMode = settings.mode;
      var control_input;
      addClasses(wrapper, settings.wrapperClass, classes, inputMode);
      addClasses(control, settings.controlClass);
      append(wrapper, control);
      addClasses(dropdown, settings.dropdownClass, inputMode);

      if (settings.copyClassesToDropdown) {
        addClasses(dropdown, classes);
      }

      addClasses(dropdown_content, settings.dropdownContentClass);
      append(dropdown, dropdown_content);
      getDom(settings.dropdownParent || wrapper).appendChild(dropdown); // default controlInput

      if (isHtmlString(settings.controlInput)) {
        control_input = getDom(settings.controlInput); // set attributes

        var attrs = ['autocorrect', 'autocapitalize', 'autocomplete'];
        iterate$1(attrs, attr => {
          if (input.getAttribute(attr)) {
            setAttr$1(control_input, {
              [attr]: input.getAttribute(attr)
            });
          }
        });
        control_input.tabIndex = -1;
        control.appendChild(control_input);
        this.focus_node = control_input; // dom element
      } else if (settings.controlInput) {
        control_input = getDom(settings.controlInput);
        this.focus_node = control_input;
      } else {
        control_input = getDom('<input/>');
        this.focus_node = control;
      }

      this.wrapper = wrapper;
      this.dropdown = dropdown;
      this.dropdown_content = dropdown_content;
      this.control = control;
      this.control_input = control_input;
      this.setup();
    }
    /**
     * set up event bindings.
     *
     */


    setup() {
      const self = this;
      const settings = self.settings;
      const control_input = self.control_input;
      const dropdown = self.dropdown;
      const dropdown_content = self.dropdown_content;
      const wrapper = self.wrapper;
      const control = self.control;
      const input = self.input;
      const focus_node = self.focus_node;
      const passive_event = {
        passive: true
      };
      const listboxId = self.inputId + '-ts-dropdown';
      setAttr$1(dropdown_content, {
        id: listboxId
      });
      setAttr$1(focus_node, {
        role: 'combobox',
        'aria-haspopup': 'listbox',
        'aria-expanded': 'false',
        'aria-controls': listboxId
      });
      const control_id = getId(focus_node, self.inputId + '-ts-control');
      const query = "label[for='" + escapeQuery(self.inputId) + "']";
      const label = document.querySelector(query);
      const label_click = self.focus.bind(self);

      if (label) {
        addEvent(label, 'click', label_click);
        setAttr$1(label, {
          for: control_id
        });
        const label_id = getId(label, self.inputId + '-ts-label');
        setAttr$1(focus_node, {
          'aria-labelledby': label_id
        });
        setAttr$1(dropdown_content, {
          'aria-labelledby': label_id
        });
      }

      wrapper.style.width = input.style.width;

      if (self.plugins.names.length) {
        const classes_plugins = 'plugin-' + self.plugins.names.join(' plugin-');
        addClasses([wrapper, dropdown], classes_plugins);
      }

      if ((settings.maxItems === null || settings.maxItems > 1) && self.is_select_tag) {
        setAttr$1(input, {
          multiple: 'multiple'
        });
      }

      if (settings.placeholder) {
        setAttr$1(control_input, {
          placeholder: settings.placeholder
        });
      } // if splitOn was not passed in, construct it from the delimiter to allow pasting universally


      if (!settings.splitOn && settings.delimiter) {
        settings.splitOn = new RegExp('\\s*' + escape_regex(settings.delimiter) + '+\\s*');
      } // debounce user defined load() if loadThrottle > 0
      // after initializePlugins() so plugins can create/modify user defined loaders


      if (settings.load && settings.loadThrottle) {
        settings.load = loadDebounce(settings.load, settings.loadThrottle);
      }

      self.control_input.type = input.type;
      addEvent(dropdown, 'mousemove', () => {
        self.ignoreHover = false;
      });
      addEvent(dropdown, 'mouseenter', e => {
        var target_match = parentMatch(e.target, '[data-selectable]', dropdown);
        if (target_match) self.onOptionHover(e, target_match);
      }, {
        capture: true
      }); // clicking on an option should select it

      addEvent(dropdown, 'click', evt => {
        const option = parentMatch(evt.target, '[data-selectable]');

        if (option) {
          self.onOptionSelect(evt, option);
          preventDefault(evt, true);
        }
      });
      addEvent(control, 'click', evt => {
        var target_match = parentMatch(evt.target, '[data-ts-item]', control);

        if (target_match && self.onItemSelect(evt, target_match)) {
          preventDefault(evt, true);
          return;
        } // retain focus (see control_input mousedown)


        if (control_input.value != '') {
          return;
        }

        self.onClick();
        preventDefault(evt, true);
      }); // keydown on focus_node for arrow_down/arrow_up

      addEvent(focus_node, 'keydown', e => self.onKeyDown(e)); // keypress and input/keyup

      addEvent(control_input, 'keypress', e => self.onKeyPress(e));
      addEvent(control_input, 'input', e => self.onInput(e));
      addEvent(focus_node, 'blur', e => self.onBlur(e));
      addEvent(focus_node, 'focus', e => self.onFocus(e));
      addEvent(control_input, 'paste', e => self.onPaste(e));

      const doc_mousedown = evt => {
        // blur if target is outside of this instance
        // dropdown is not always inside wrapper
        const target = evt.composedPath()[0];

        if (!wrapper.contains(target) && !dropdown.contains(target)) {
          if (self.isFocused) {
            self.blur();
          }

          self.inputState();
          return;
        } // retain focus by preventing native handling. if the
        // event target is the input it should not be modified.
        // otherwise, text selection within the input won't work.
        // Fixes bug #212 which is no covered by tests


        if (target == control_input && self.isOpen) {
          evt.stopPropagation(); // clicking anywhere in the control should not blur the control_input (which would close the dropdown)
        } else {
          preventDefault(evt, true);
        }
      };

      const win_scroll = () => {
        if (self.isOpen) {
          self.positionDropdown();
        }
      };

      addEvent(document, 'mousedown', doc_mousedown);
      addEvent(window, 'scroll', win_scroll, passive_event);
      addEvent(window, 'resize', win_scroll, passive_event);

      this._destroy = () => {
        document.removeEventListener('mousedown', doc_mousedown);
        window.removeEventListener('scroll', win_scroll);
        window.removeEventListener('resize', win_scroll);
        if (label) label.removeEventListener('click', label_click);
      }; // store original html and tab index so that they can be
      // restored when the destroy() method is called.


      this.revertSettings = {
        innerHTML: input.innerHTML,
        tabIndex: input.tabIndex
      };
      input.tabIndex = -1;
      input.insertAdjacentElement('afterend', self.wrapper);
      self.sync(false);
      settings.items = [];
      delete settings.optgroups;
      delete settings.options;
      addEvent(input, 'invalid', () => {
        if (self.isValid) {
          self.isValid = false;
          self.isInvalid = true;
          self.refreshState();
        }
      });
      self.updateOriginalInput();
      self.refreshItems();
      self.close(false);
      self.inputState();
      self.isSetup = true;

      if (input.disabled) {
        self.disable();
      } else {
        self.enable(); //sets tabIndex
      }

      self.on('change', this.onChange);
      addClasses(input, 'tomselected', 'ts-hidden-accessible');
      self.trigger('initialize'); // preload options

      if (settings.preload === true) {
        self.preload();
      }
    }
    /**
     * Register options and optgroups
     *
     */


    setupOptions(options = [], optgroups = []) {
      // build options table
      this.addOptions(options); // build optgroup table

      iterate$1(optgroups, optgroup => {
        this.registerOptionGroup(optgroup);
      });
    }
    /**
     * Sets up default rendering functions.
     */


    setupTemplates() {
      var self = this;
      var field_label = self.settings.labelField;
      var field_optgroup = self.settings.optgroupLabelField;
      var templates = {
        'optgroup': data => {
          let optgroup = document.createElement('div');
          optgroup.className = 'optgroup';
          optgroup.appendChild(data.options);
          return optgroup;
        },
        'optgroup_header': (data, escape) => {
          return '<div class="optgroup-header">' + escape(data[field_optgroup]) + '</div>';
        },
        'option': (data, escape) => {
          return '<div>' + escape(data[field_label]) + '</div>';
        },
        'item': (data, escape) => {
          return '<div>' + escape(data[field_label]) + '</div>';
        },
        'option_create': (data, escape) => {
          return '<div class="create">Add <strong>' + escape(data.input) + '</strong>&hellip;</div>';
        },
        'no_results': () => {
          return '<div class="no-results">No results found</div>';
        },
        'loading': () => {
          return '<div class="spinner"></div>';
        },
        'not_loading': () => {},
        'dropdown': () => {
          return '<div></div>';
        }
      };
      self.settings.render = Object.assign({}, templates, self.settings.render);
    }
    /**
     * Maps fired events to callbacks provided
     * in the settings used when creating the control.
     */


    setupCallbacks() {
      var key, fn;
      var callbacks = {
        'initialize': 'onInitialize',
        'change': 'onChange',
        'item_add': 'onItemAdd',
        'item_remove': 'onItemRemove',
        'item_select': 'onItemSelect',
        'clear': 'onClear',
        'option_add': 'onOptionAdd',
        'option_remove': 'onOptionRemove',
        'option_clear': 'onOptionClear',
        'optgroup_add': 'onOptionGroupAdd',
        'optgroup_remove': 'onOptionGroupRemove',
        'optgroup_clear': 'onOptionGroupClear',
        'dropdown_open': 'onDropdownOpen',
        'dropdown_close': 'onDropdownClose',
        'type': 'onType',
        'load': 'onLoad',
        'focus': 'onFocus',
        'blur': 'onBlur'
      };

      for (key in callbacks) {
        fn = this.settings[callbacks[key]];
        if (fn) this.on(key, fn);
      }
    }
    /**
     * Sync the Tom Select instance with the original input or select
     *
     */


    sync(get_settings = true) {
      const self = this;
      const settings = get_settings ? getSettings(self.input, {
        delimiter: self.settings.delimiter
      }) : self.settings;
      self.setupOptions(settings.options, settings.optgroups);
      self.setValue(settings.items || [], true); // silent prevents recursion

      self.lastQuery = null; // so updated options will be displayed in dropdown
    }
    /**
     * Triggered when the main control element
     * has a click event.
     *
     */


    onClick() {
      var self = this;

      if (self.activeItems.length > 0) {
        self.clearActiveItems();
        self.focus();
        return;
      }

      if (self.isFocused && self.isOpen) {
        self.blur();
      } else {
        self.focus();
      }
    }
    /**
     * @deprecated v1.7
     *
     */


    onMouseDown() {}
    /**
     * Triggered when the value of the control has been changed.
     * This should propagate the event to the original DOM
     * input / select element.
     */


    onChange() {
      triggerEvent(this.input, 'input');
      triggerEvent(this.input, 'change');
    }
    /**
     * Triggered on <input> paste.
     *
     */


    onPaste(e) {
      var self = this;

      if (self.isInputHidden || self.isLocked) {
        preventDefault(e);
        return;
      } // If a regex or string is included, this will split the pasted
      // input and create Items for each separate value


      if (!self.settings.splitOn) {
        return;
      } // Wait for pasted text to be recognized in value


      setTimeout(() => {
        var pastedText = self.inputValue();

        if (!pastedText.match(self.settings.splitOn)) {
          return;
        }

        var splitInput = pastedText.trim().split(self.settings.splitOn);
        iterate$1(splitInput, piece => {
          const hash = hash_key(piece);

          if (hash) {
            if (this.options[piece]) {
              self.addItem(piece);
            } else {
              self.createItem(piece);
            }
          }
        });
      }, 0);
    }
    /**
     * Triggered on <input> keypress.
     *
     */


    onKeyPress(e) {
      var self = this;

      if (self.isLocked) {
        preventDefault(e);
        return;
      }

      var character = String.fromCharCode(e.keyCode || e.which);

      if (self.settings.create && self.settings.mode === 'multi' && character === self.settings.delimiter) {
        self.createItem();
        preventDefault(e);
        return;
      }
    }
    /**
     * Triggered on <input> keydown.
     *
     */


    onKeyDown(e) {
      var self = this;
      self.ignoreHover = true;

      if (self.isLocked) {
        if (e.keyCode !== KEY_TAB) {
          preventDefault(e);
        }

        return;
      }

      switch (e.keyCode) {
        // ctrl+A: select all
        case KEY_A:
          if (isKeyDown(KEY_SHORTCUT, e)) {
            if (self.control_input.value == '') {
              preventDefault(e);
              self.selectAll();
              return;
            }
          }

          break;
        // esc: close dropdown

        case KEY_ESC:
          if (self.isOpen) {
            preventDefault(e, true);
            self.close();
          }

          self.clearActiveItems();
          return;
        // down: open dropdown or move selection down

        case KEY_DOWN:
          if (!self.isOpen && self.hasOptions) {
            self.open();
          } else if (self.activeOption) {
            let next = self.getAdjacent(self.activeOption, 1);
            if (next) self.setActiveOption(next);
          }

          preventDefault(e);
          return;
        // up: move selection up

        case KEY_UP:
          if (self.activeOption) {
            let prev = self.getAdjacent(self.activeOption, -1);
            if (prev) self.setActiveOption(prev);
          }

          preventDefault(e);
          return;
        // return: select active option

        case KEY_RETURN:
          if (self.canSelect(self.activeOption)) {
            self.onOptionSelect(e, self.activeOption);
            preventDefault(e); // if the option_create=null, the dropdown might be closed
          } else if (self.settings.create && self.createItem()) {
            preventDefault(e); // don't submit form when searching for a value
          } else if (document.activeElement == self.control_input && self.isOpen) {
            preventDefault(e);
          }

          return;
        // left: modifiy item selection to the left

        case KEY_LEFT:
          self.advanceSelection(-1, e);
          return;
        // right: modifiy item selection to the right

        case KEY_RIGHT:
          self.advanceSelection(1, e);
          return;
        // tab: select active option and/or create item

        case KEY_TAB:
          if (self.settings.selectOnTab) {
            if (self.canSelect(self.activeOption)) {
              self.onOptionSelect(e, self.activeOption); // prevent default [tab] behaviour of jump to the next field
              // if select isFull, then the dropdown won't be open and [tab] will work normally

              preventDefault(e);
            }

            if (self.settings.create && self.createItem()) {
              preventDefault(e);
            }
          }

          return;
        // delete|backspace: delete items

        case KEY_BACKSPACE:
        case KEY_DELETE:
          self.deleteSelection(e);
          return;
      } // don't enter text in the control_input when active items are selected


      if (self.isInputHidden && !isKeyDown(KEY_SHORTCUT, e)) {
        preventDefault(e);
      }
    }
    /**
     * Triggered on <input> keyup.
     *
     */


    onInput(e) {
      var self = this;

      if (self.isLocked) {
        return;
      }

      var value = self.inputValue();

      if (self.lastValue !== value) {
        self.lastValue = value;

        if (self.settings.shouldLoad.call(self, value)) {
          self.load(value);
        }

        self.refreshOptions();
        self.trigger('type', value);
      }
    }
    /**
     * Triggered when the user rolls over
     * an option in the autocomplete dropdown menu.
     *
     */


    onOptionHover(evt, option) {
      if (this.ignoreHover) return;
      this.setActiveOption(option, false);
    }
    /**
     * Triggered on <input> focus.
     *
     */


    onFocus(e) {
      var self = this;
      var wasFocused = self.isFocused;

      if (self.isDisabled) {
        self.blur();
        preventDefault(e);
        return;
      }

      if (self.ignoreFocus) return;
      self.isFocused = true;
      if (self.settings.preload === 'focus') self.preload();
      if (!wasFocused) self.trigger('focus');

      if (!self.activeItems.length) {
        self.showInput();
        self.refreshOptions(!!self.settings.openOnFocus);
      }

      self.refreshState();
    }
    /**
     * Triggered on <input> blur.
     *
     */


    onBlur(e) {
      if (document.hasFocus() === false) return;
      var self = this;
      if (!self.isFocused) return;
      self.isFocused = false;
      self.ignoreFocus = false;

      var deactivate = () => {
        self.close();
        self.setActiveItem();
        self.setCaret(self.items.length);
        self.trigger('blur');
      };

      if (self.settings.create && self.settings.createOnBlur) {
        self.createItem(null, deactivate);
      } else {
        deactivate();
      }
    }
    /**
     * Triggered when the user clicks on an option
     * in the autocomplete dropdown menu.
     *
     */


    onOptionSelect(evt, option) {
      var value,
          self = this; // should not be possible to trigger a option under a disabled optgroup

      if (option.parentElement && option.parentElement.matches('[data-disabled]')) {
        return;
      }

      if (option.classList.contains('create')) {
        self.createItem(null, () => {
          if (self.settings.closeAfterSelect) {
            self.close();
          }
        });
      } else {
        value = option.dataset.value;

        if (typeof value !== 'undefined') {
          self.lastQuery = null;
          self.addItem(value);

          if (self.settings.closeAfterSelect) {
            self.close();
          }

          if (!self.settings.hideSelected && evt.type && /click/.test(evt.type)) {
            self.setActiveOption(option);
          }
        }
      }
    }
    /**
     * Return true if the given option can be selected
     *
     */


    canSelect(option) {
      if (this.isOpen && option && this.dropdown_content.contains(option)) {
        return true;
      }

      return false;
    }
    /**
     * Triggered when the user clicks on an item
     * that has been selected.
     *
     */


    onItemSelect(evt, item) {
      var self = this;

      if (!self.isLocked && self.settings.mode === 'multi') {
        preventDefault(evt);
        self.setActiveItem(item, evt);
        return true;
      }

      return false;
    }
    /**
     * Determines whether or not to invoke
     * the user-provided option provider / loader
     *
     * Note, there is a subtle difference between
     * this.canLoad() and this.settings.shouldLoad();
     *
     *	- settings.shouldLoad() is a user-input validator.
     *	When false is returned, the not_loading template
     *	will be added to the dropdown
     *
     *	- canLoad() is lower level validator that checks
     * 	the Tom Select instance. There is no inherent user
     *	feedback when canLoad returns false
     *
     */


    canLoad(value) {
      if (!this.settings.load) return false;
      if (this.loadedSearches.hasOwnProperty(value)) return false;
      return true;
    }
    /**
     * Invokes the user-provided option provider / loader.
     *
     */


    load(value) {
      const self = this;
      if (!self.canLoad(value)) return;
      addClasses(self.wrapper, self.settings.loadingClass);
      self.loading++;
      const callback = self.loadCallback.bind(self);
      self.settings.load.call(self, value, callback);
    }
    /**
     * Invoked by the user-provided option provider
     *
     */


    loadCallback(options, optgroups) {
      const self = this;
      self.loading = Math.max(self.loading - 1, 0);
      self.lastQuery = null;
      self.clearActiveOption(); // when new results load, focus should be on first option

      self.setupOptions(options, optgroups);
      self.refreshOptions(self.isFocused && !self.isInputHidden);

      if (!self.loading) {
        removeClasses(self.wrapper, self.settings.loadingClass);
      }

      self.trigger('load', options, optgroups);
    }

    preload() {
      var classList = this.wrapper.classList;
      if (classList.contains('preloaded')) return;
      classList.add('preloaded');
      this.load('');
    }
    /**
     * Sets the input field of the control to the specified value.
     *
     */


    setTextboxValue(value = '') {
      var input = this.control_input;
      var changed = input.value !== value;

      if (changed) {
        input.value = value;
        triggerEvent(input, 'update');
        this.lastValue = value;
      }
    }
    /**
     * Returns the value of the control. If multiple items
     * can be selected (e.g. <select multiple>), this returns
     * an array. If only one item can be selected, this
     * returns a string.
     *
     */


    getValue() {
      if (this.is_select_tag && this.input.hasAttribute('multiple')) {
        return this.items;
      }

      return this.items.join(this.settings.delimiter);
    }
    /**
     * Resets the selected items to the given value.
     *
     */


    setValue(value, silent) {
      var events = silent ? [] : ['change'];
      debounce_events(this, events, () => {
        this.clear(silent);
        this.addItems(value, silent);
      });
    }
    /**
     * Resets the number of max items to the given value
     *
     */


    setMaxItems(value) {
      if (value === 0) value = null; //reset to unlimited items.

      this.settings.maxItems = value;
      this.refreshState();
    }
    /**
     * Sets the selected item.
     *
     */


    setActiveItem(item, e) {
      var self = this;
      var eventName;
      var i, begin, end, swap;
      var last;
      if (self.settings.mode === 'single') return; // clear the active selection

      if (!item) {
        self.clearActiveItems();

        if (self.isFocused) {
          self.showInput();
        }

        return;
      } // modify selection


      eventName = e && e.type.toLowerCase();

      if (eventName === 'click' && isKeyDown('shiftKey', e) && self.activeItems.length) {
        last = self.getLastActive();
        begin = Array.prototype.indexOf.call(self.control.children, last);
        end = Array.prototype.indexOf.call(self.control.children, item);

        if (begin > end) {
          swap = begin;
          begin = end;
          end = swap;
        }

        for (i = begin; i <= end; i++) {
          item = self.control.children[i];

          if (self.activeItems.indexOf(item) === -1) {
            self.setActiveItemClass(item);
          }
        }

        preventDefault(e);
      } else if (eventName === 'click' && isKeyDown(KEY_SHORTCUT, e) || eventName === 'keydown' && isKeyDown('shiftKey', e)) {
        if (item.classList.contains('active')) {
          self.removeActiveItem(item);
        } else {
          self.setActiveItemClass(item);
        }
      } else {
        self.clearActiveItems();
        self.setActiveItemClass(item);
      } // ensure control has focus


      self.hideInput();

      if (!self.isFocused) {
        self.focus();
      }
    }
    /**
     * Set the active and last-active classes
     *
     */


    setActiveItemClass(item) {
      const self = this;
      const last_active = self.control.querySelector('.last-active');
      if (last_active) removeClasses(last_active, 'last-active');
      addClasses(item, 'active last-active');
      self.trigger('item_select', item);

      if (self.activeItems.indexOf(item) == -1) {
        self.activeItems.push(item);
      }
    }
    /**
     * Remove active item
     *
     */


    removeActiveItem(item) {
      var idx = this.activeItems.indexOf(item);
      this.activeItems.splice(idx, 1);
      removeClasses(item, 'active');
    }
    /**
     * Clears all the active items
     *
     */


    clearActiveItems() {
      removeClasses(this.activeItems, 'active');
      this.activeItems = [];
    }
    /**
     * Sets the selected item in the dropdown menu
     * of available options.
     *
     */


    setActiveOption(option, scroll = true) {
      if (option === this.activeOption) {
        return;
      }

      this.clearActiveOption();
      if (!option) return;
      this.activeOption = option;
      setAttr$1(this.focus_node, {
        'aria-activedescendant': option.getAttribute('id')
      });
      setAttr$1(option, {
        'aria-selected': 'true'
      });
      addClasses(option, 'active');
      if (scroll) this.scrollToOption(option);
    }
    /**
     * Sets the dropdown_content scrollTop to display the option
     *
     */


    scrollToOption(option, behavior) {
      if (!option) return;
      const content = this.dropdown_content;
      const height_menu = content.clientHeight;
      const scrollTop = content.scrollTop || 0;
      const height_item = option.offsetHeight;
      const y = option.getBoundingClientRect().top - content.getBoundingClientRect().top + scrollTop;

      if (y + height_item > height_menu + scrollTop) {
        this.scroll(y - height_menu + height_item, behavior);
      } else if (y < scrollTop) {
        this.scroll(y, behavior);
      }
    }
    /**
     * Scroll the dropdown to the given position
     *
     */


    scroll(scrollTop, behavior) {
      const content = this.dropdown_content;

      if (behavior) {
        content.style.scrollBehavior = behavior;
      }

      content.scrollTop = scrollTop;
      content.style.scrollBehavior = '';
    }
    /**
     * Clears the active option
     *
     */


    clearActiveOption() {
      if (this.activeOption) {
        removeClasses(this.activeOption, 'active');
        setAttr$1(this.activeOption, {
          'aria-selected': null
        });
      }

      this.activeOption = null;
      setAttr$1(this.focus_node, {
        'aria-activedescendant': null
      });
    }
    /**
     * Selects all items (CTRL + A).
     */


    selectAll() {
      const self = this;
      if (self.settings.mode === 'single') return;
      const activeItems = self.controlChildren();
      if (!activeItems.length) return;
      self.hideInput();
      self.close();
      self.activeItems = activeItems;
      iterate$1(activeItems, item => {
        self.setActiveItemClass(item);
      });
    }
    /**
     * Determines if the control_input should be in a hidden or visible state
     *
     */


    inputState() {
      var self = this;
      if (!self.control.contains(self.control_input)) return;
      setAttr$1(self.control_input, {
        placeholder: self.settings.placeholder
      });

      if (self.activeItems.length > 0 || !self.isFocused && self.settings.hidePlaceholder && self.items.length > 0) {
        self.setTextboxValue();
        self.isInputHidden = true;
      } else {
        if (self.settings.hidePlaceholder && self.items.length > 0) {
          setAttr$1(self.control_input, {
            placeholder: ''
          });
        }

        self.isInputHidden = false;
      }

      self.wrapper.classList.toggle('input-hidden', self.isInputHidden);
    }
    /**
     * Hides the input element out of view, while
     * retaining its focus.
     * @deprecated 1.3
     */


    hideInput() {
      this.inputState();
    }
    /**
     * Restores input visibility.
     * @deprecated 1.3
     */


    showInput() {
      this.inputState();
    }
    /**
     * Get the input value
     */


    inputValue() {
      return this.control_input.value.trim();
    }
    /**
     * Gives the control focus.
     */


    focus() {
      var self = this;
      if (self.isDisabled) return;
      self.ignoreFocus = true;

      if (self.control_input.offsetWidth) {
        self.control_input.focus();
      } else {
        self.focus_node.focus();
      }

      setTimeout(() => {
        self.ignoreFocus = false;
        self.onFocus();
      }, 0);
    }
    /**
     * Forces the control out of focus.
     *
     */


    blur() {
      this.focus_node.blur();
      this.onBlur();
    }
    /**
     * Returns a function that scores an object
     * to show how good of a match it is to the
     * provided query.
     *
     * @return {function}
     */


    getScoreFunction(query) {
      return this.sifter.getScoreFunction(query, this.getSearchOptions());
    }
    /**
     * Returns search options for sifter (the system
     * for scoring and sorting results).
     *
     * @see https://github.com/orchidjs/sifter.js
     * @return {object}
     */


    getSearchOptions() {
      var settings = this.settings;
      var sort = settings.sortField;

      if (typeof settings.sortField === 'string') {
        sort = [{
          field: settings.sortField
        }];
      }

      return {
        fields: settings.searchField,
        conjunction: settings.searchConjunction,
        sort: sort,
        nesting: settings.nesting
      };
    }
    /**
     * Searches through available options and returns
     * a sorted array of matches.
     *
     */


    search(query) {
      var result, calculateScore;
      var self = this;
      var options = this.getSearchOptions(); // validate user-provided result scoring function

      if (self.settings.score) {
        calculateScore = self.settings.score.call(self, query);

        if (typeof calculateScore !== 'function') {
          throw new Error('Tom Select "score" setting must be a function that returns a function');
        }
      } // perform search


      if (query !== self.lastQuery) {
        self.lastQuery = query;
        result = self.sifter.search(query, Object.assign(options, {
          score: calculateScore
        }));
        self.currentResults = result;
      } else {
        result = Object.assign({}, self.currentResults);
      } // filter out selected items


      if (self.settings.hideSelected) {
        result.items = result.items.filter(item => {
          let hashed = hash_key(item.id);
          return !(hashed && self.items.indexOf(hashed) !== -1);
        });
      }

      return result;
    }
    /**
     * Refreshes the list of available options shown
     * in the autocomplete dropdown menu.
     *
     */


    refreshOptions(triggerDropdown = true) {
      var i, j, k, n, optgroup, optgroups, html, has_create_option, active_group;
      var create;
      const groups = {};
      const groups_order = [];
      var self = this;
      var query = self.inputValue();
      const same_query = query === self.lastQuery || query == '' && self.lastQuery == null;
      var results = self.search(query);
      var active_option = null;
      var show_dropdown = self.settings.shouldOpen || false;
      var dropdown_content = self.dropdown_content;

      if (same_query) {
        active_option = self.activeOption;

        if (active_option) {
          active_group = active_option.closest('[data-group]');
        }
      } // build markup


      n = results.items.length;

      if (typeof self.settings.maxOptions === 'number') {
        n = Math.min(n, self.settings.maxOptions);
      }

      if (n > 0) {
        show_dropdown = true;
      } // render and group available options individually


      for (i = 0; i < n; i++) {
        // get option dom element
        let item = results.items[i];
        if (!item) continue;
        let opt_value = item.id;
        let option = self.options[opt_value];
        if (option === undefined) continue;
        let opt_hash = get_hash(opt_value);
        let option_el = self.getOption(opt_hash, true); // toggle 'selected' class

        if (!self.settings.hideSelected) {
          option_el.classList.toggle('selected', self.items.includes(opt_hash));
        }

        optgroup = option[self.settings.optgroupField] || '';
        optgroups = Array.isArray(optgroup) ? optgroup : [optgroup];

        for (j = 0, k = optgroups && optgroups.length; j < k; j++) {
          optgroup = optgroups[j];

          if (!self.optgroups.hasOwnProperty(optgroup)) {
            optgroup = '';
          }

          let group_fragment = groups[optgroup];

          if (group_fragment === undefined) {
            group_fragment = document.createDocumentFragment();
            groups_order.push(optgroup);
          } // nodes can only have one parent, so if the option is in mutple groups, we need a clone


          if (j > 0) {
            option_el = option_el.cloneNode(true);
            setAttr$1(option_el, {
              id: option.$id + '-clone-' + j,
              'aria-selected': null
            });
            option_el.classList.add('ts-cloned');
            removeClasses(option_el, 'active'); // make sure we keep the activeOption in the same group

            if (self.activeOption && self.activeOption.dataset.value == opt_value) {
              if (active_group && active_group.dataset.group === optgroup.toString()) {
                active_option = option_el;
              }
            }
          }

          group_fragment.appendChild(option_el);
          groups[optgroup] = group_fragment;
        }
      } // sort optgroups


      if (self.settings.lockOptgroupOrder) {
        groups_order.sort((a, b) => {
          const grp_a = self.optgroups[a];
          const grp_b = self.optgroups[b];
          const a_order = grp_a && grp_a.$order || 0;
          const b_order = grp_b && grp_b.$order || 0;
          return a_order - b_order;
        });
      } // render optgroup headers & join groups


      html = document.createDocumentFragment();
      iterate$1(groups_order, optgroup => {
        let group_fragment = groups[optgroup];
        if (!group_fragment || !group_fragment.children.length) return;
        let group_heading = self.optgroups[optgroup];

        if (group_heading !== undefined) {
          let group_options = document.createDocumentFragment();
          let header = self.render('optgroup_header', group_heading);
          append(group_options, header);
          append(group_options, group_fragment);
          let group_html = self.render('optgroup', {
            group: group_heading,
            options: group_options
          });
          append(html, group_html);
        } else {
          append(html, group_fragment);
        }
      });
      dropdown_content.innerHTML = '';
      append(dropdown_content, html); // highlight matching terms inline

      if (self.settings.highlight) {
        removeHighlight(dropdown_content);

        if (results.query.length && results.tokens.length) {
          iterate$1(results.tokens, tok => {
            highlight(dropdown_content, tok.regex);
          });
        }
      } // helper method for adding templates to dropdown


      var add_template = template => {
        let content = self.render(template, {
          input: query
        });

        if (content) {
          show_dropdown = true;
          dropdown_content.insertBefore(content, dropdown_content.firstChild);
        }

        return content;
      }; // add loading message


      if (self.loading) {
        add_template('loading'); // invalid query
      } else if (!self.settings.shouldLoad.call(self, query)) {
        add_template('not_loading'); // add no_results message
      } else if (results.items.length === 0) {
        add_template('no_results');
      } // add create option


      has_create_option = self.canCreate(query);

      if (has_create_option) {
        create = add_template('option_create');
      } // activate


      self.hasOptions = results.items.length > 0 || has_create_option;

      if (show_dropdown) {
        if (results.items.length > 0) {
          if (!active_option && self.settings.mode === 'single' && self.items[0] != undefined) {
            active_option = self.getOption(self.items[0]);
          }

          if (!dropdown_content.contains(active_option)) {
            let active_index = 0;

            if (create && !self.settings.addPrecedence) {
              active_index = 1;
            }

            active_option = self.selectable()[active_index];
          }
        } else if (create) {
          active_option = create;
        }

        if (triggerDropdown && !self.isOpen) {
          self.open();
          self.scrollToOption(active_option, 'auto');
        }

        self.setActiveOption(active_option);
      } else {
        self.clearActiveOption();

        if (triggerDropdown && self.isOpen) {
          self.close(false); // if create_option=null, we want the dropdown to close but not reset the textbox value
        }
      }
    }
    /**
     * Return list of selectable options
     *
     */


    selectable() {
      return this.dropdown_content.querySelectorAll('[data-selectable]');
    }
    /**
     * Adds an available option. If it already exists,
     * nothing will happen. Note: this does not refresh
     * the options list dropdown (use `refreshOptions`
     * for that).
     *
     * Usage:
     *
     *   this.addOption(data)
     *
     */


    addOption(data, user_created = false) {
      const self = this; // @deprecated 1.7.7
      // use addOptions( array, user_created ) for adding multiple options

      if (Array.isArray(data)) {
        self.addOptions(data, user_created);
        return false;
      }

      const key = hash_key(data[self.settings.valueField]);

      if (key === null || self.options.hasOwnProperty(key)) {
        return false;
      }

      data.$order = data.$order || ++self.order;
      data.$id = self.inputId + '-opt-' + data.$order;
      self.options[key] = data;
      self.lastQuery = null;

      if (user_created) {
        self.userOptions[key] = user_created;
        self.trigger('option_add', key, data);
      }

      return key;
    }
    /**
     * Add multiple options
     *
     */


    addOptions(data, user_created = false) {
      iterate$1(data, dat => {
        this.addOption(dat, user_created);
      });
    }
    /**
     * @deprecated 1.7.7
     */


    registerOption(data) {
      return this.addOption(data);
    }
    /**
     * Registers an option group to the pool of option groups.
     *
     * @return {boolean|string}
     */


    registerOptionGroup(data) {
      var key = hash_key(data[this.settings.optgroupValueField]);
      if (key === null) return false;
      data.$order = data.$order || ++this.order;
      this.optgroups[key] = data;
      return key;
    }
    /**
     * Registers a new optgroup for options
     * to be bucketed into.
     *
     */


    addOptionGroup(id, data) {
      var hashed_id;
      data[this.settings.optgroupValueField] = id;

      if (hashed_id = this.registerOptionGroup(data)) {
        this.trigger('optgroup_add', hashed_id, data);
      }
    }
    /**
     * Removes an existing option group.
     *
     */


    removeOptionGroup(id) {
      if (this.optgroups.hasOwnProperty(id)) {
        delete this.optgroups[id];
        this.clearCache();
        this.trigger('optgroup_remove', id);
      }
    }
    /**
     * Clears all existing option groups.
     */


    clearOptionGroups() {
      this.optgroups = {};
      this.clearCache();
      this.trigger('optgroup_clear');
    }
    /**
     * Updates an option available for selection. If
     * it is visible in the selected items or options
     * dropdown, it will be re-rendered automatically.
     *
     */


    updateOption(value, data) {
      const self = this;
      var item_new;
      var index_item;
      const value_old = hash_key(value);
      const value_new = hash_key(data[self.settings.valueField]); // sanity checks

      if (value_old === null) return;
      const data_old = self.options[value_old];
      if (data_old == undefined) return;
      if (typeof value_new !== 'string') throw new Error('Value must be set in option data');
      const option = self.getOption(value_old);
      const item = self.getItem(value_old);
      data.$order = data.$order || data_old.$order;
      delete self.options[value_old]; // invalidate render cache
      // don't remove existing node yet, we'll remove it after replacing it

      self.uncacheValue(value_new);
      self.options[value_new] = data; // update the option if it's in the dropdown

      if (option) {
        if (self.dropdown_content.contains(option)) {
          const option_new = self._render('option', data);

          replaceNode(option, option_new);

          if (self.activeOption === option) {
            self.setActiveOption(option_new);
          }
        }

        option.remove();
      } // update the item if we have one


      if (item) {
        index_item = self.items.indexOf(value_old);

        if (index_item !== -1) {
          self.items.splice(index_item, 1, value_new);
        }

        item_new = self._render('item', data);
        if (item.classList.contains('active')) addClasses(item_new, 'active');
        replaceNode(item, item_new);
      } // invalidate last query because we might have updated the sortField


      self.lastQuery = null;
    }
    /**
     * Removes a single option.
     *
     */


    removeOption(value, silent) {
      const self = this;
      value = get_hash(value);
      self.uncacheValue(value);
      delete self.userOptions[value];
      delete self.options[value];
      self.lastQuery = null;
      self.trigger('option_remove', value);
      self.removeItem(value, silent);
    }
    /**
     * Clears all options.
     */


    clearOptions(filter) {
      const boundFilter = (filter || this.clearFilter).bind(this);
      this.loadedSearches = {};
      this.userOptions = {};
      this.clearCache();
      const selected = {};
      iterate$1(this.options, (option, key) => {
        if (boundFilter(option, key)) {
          selected[key] = option;
        }
      });
      this.options = this.sifter.items = selected;
      this.lastQuery = null;
      this.trigger('option_clear');
    }
    /**
     * Used by clearOptions() to decide whether or not an option should be removed
     * Return true to keep an option, false to remove
     *
     */


    clearFilter(option, value) {
      if (this.items.indexOf(value) >= 0) {
        return true;
      }

      return false;
    }
    /**
     * Returns the dom element of the option
     * matching the given value.
     *
     */


    getOption(value, create = false) {
      const hashed = hash_key(value);
      if (hashed === null) return null;
      const option = this.options[hashed];

      if (option != undefined) {
        if (option.$div) {
          return option.$div;
        }

        if (create) {
          return this._render('option', option);
        }
      }

      return null;
    }
    /**
     * Returns the dom element of the next or previous dom element of the same type
     * Note: adjacent options may not be adjacent DOM elements (optgroups)
     *
     */


    getAdjacent(option, direction, type = 'option') {
      var self = this,
          all;

      if (!option) {
        return null;
      }

      if (type == 'item') {
        all = self.controlChildren();
      } else {
        all = self.dropdown_content.querySelectorAll('[data-selectable]');
      }

      for (let i = 0; i < all.length; i++) {
        if (all[i] != option) {
          continue;
        }

        if (direction > 0) {
          return all[i + 1];
        }

        return all[i - 1];
      }

      return null;
    }
    /**
     * Returns the dom element of the item
     * matching the given value.
     *
     */


    getItem(item) {
      if (typeof item == 'object') {
        return item;
      }

      var value = hash_key(item);
      return value !== null ? this.control.querySelector(`[data-value="${addSlashes(value)}"]`) : null;
    }
    /**
     * "Selects" multiple items at once. Adds them to the list
     * at the current caret position.
     *
     */


    addItems(values, silent) {
      var self = this;
      var items = Array.isArray(values) ? values : [values];
      items = items.filter(x => self.items.indexOf(x) === -1);
      const last_item = items[items.length - 1];
      items.forEach(item => {
        self.isPending = item !== last_item;
        self.addItem(item, silent);
      });
    }
    /**
     * "Selects" an item. Adds it to the list
     * at the current caret position.
     *
     */


    addItem(value, silent) {
      var events = silent ? [] : ['change', 'dropdown_close'];
      debounce_events(this, events, () => {
        var item, wasFull;
        const self = this;
        const inputMode = self.settings.mode;
        const hashed = hash_key(value);

        if (hashed && self.items.indexOf(hashed) !== -1) {
          if (inputMode === 'single') {
            self.close();
          }

          if (inputMode === 'single' || !self.settings.duplicates) {
            return;
          }
        }

        if (hashed === null || !self.options.hasOwnProperty(hashed)) return;
        if (inputMode === 'single') self.clear(silent);
        if (inputMode === 'multi' && self.isFull()) return;
        item = self._render('item', self.options[hashed]);

        if (self.control.contains(item)) {
          // duplicates
          item = item.cloneNode(true);
        }

        wasFull = self.isFull();
        self.items.splice(self.caretPos, 0, hashed);
        self.insertAtCaret(item);

        if (self.isSetup) {
          // update menu / remove the option (if this is not one item being added as part of series)
          if (!self.isPending && self.settings.hideSelected) {
            let option = self.getOption(hashed);
            let next = self.getAdjacent(option, 1);

            if (next) {
              self.setActiveOption(next);
            }
          } // refreshOptions after setActiveOption(),
          // otherwise setActiveOption() will be called by refreshOptions() with the wrong value


          if (!self.isPending && !self.settings.closeAfterSelect) {
            self.refreshOptions(self.isFocused && inputMode !== 'single');
          } // hide the menu if the maximum number of items have been selected or no options are left


          if (self.settings.closeAfterSelect != false && self.isFull()) {
            self.close();
          } else if (!self.isPending) {
            self.positionDropdown();
          }

          self.trigger('item_add', hashed, item);

          if (!self.isPending) {
            self.updateOriginalInput({
              silent: silent
            });
          }
        }

        if (!self.isPending || !wasFull && self.isFull()) {
          self.inputState();
          self.refreshState();
        }
      });
    }
    /**
     * Removes the selected item matching
     * the provided value.
     *
     */


    removeItem(item = null, silent) {
      const self = this;
      item = self.getItem(item);
      if (!item) return;
      var i, idx;
      const value = item.dataset.value;
      i = nodeIndex(item);
      item.remove();

      if (item.classList.contains('active')) {
        idx = self.activeItems.indexOf(item);
        self.activeItems.splice(idx, 1);
        removeClasses(item, 'active');
      }

      self.items.splice(i, 1);
      self.lastQuery = null;

      if (!self.settings.persist && self.userOptions.hasOwnProperty(value)) {
        self.removeOption(value, silent);
      }

      if (i < self.caretPos) {
        self.setCaret(self.caretPos - 1);
      }

      self.updateOriginalInput({
        silent: silent
      });
      self.refreshState();
      self.positionDropdown();
      self.trigger('item_remove', value, item);
    }
    /**
     * Invokes the `create` method provided in the
     * TomSelect options that should provide the data
     * for the new item, given the user input.
     *
     * Once this completes, it will be added
     * to the item list.
     *
     */


    createItem(input = null, callback = () => {}) {
      // triggerDropdown parameter @deprecated 2.1.1
      if (arguments.length === 3) {
        callback = arguments[2];
      }

      if (typeof callback != 'function') {
        callback = () => {};
      }

      var self = this;
      var caret = self.caretPos;
      var output;
      input = input || self.inputValue();

      if (!self.canCreate(input)) {
        callback();
        return false;
      }

      self.lock();
      var created = false;

      var create = data => {
        self.unlock();
        if (!data || typeof data !== 'object') return callback();
        var value = hash_key(data[self.settings.valueField]);

        if (typeof value !== 'string') {
          return callback();
        }

        self.setTextboxValue();
        self.addOption(data, true);
        self.setCaret(caret);
        self.addItem(value);
        callback(data);
        created = true;
      };

      if (typeof self.settings.create === 'function') {
        output = self.settings.create.call(this, input, create);
      } else {
        output = {
          [self.settings.labelField]: input,
          [self.settings.valueField]: input
        };
      }

      if (!created) {
        create(output);
      }

      return true;
    }
    /**
     * Re-renders the selected item lists.
     */


    refreshItems() {
      var self = this;
      self.lastQuery = null;

      if (self.isSetup) {
        self.addItems(self.items);
      }

      self.updateOriginalInput();
      self.refreshState();
    }
    /**
     * Updates all state-dependent attributes
     * and CSS classes.
     */


    refreshState() {
      const self = this;
      self.refreshValidityState();
      const isFull = self.isFull();
      const isLocked = self.isLocked;
      self.wrapper.classList.toggle('rtl', self.rtl);
      const wrap_classList = self.wrapper.classList;
      wrap_classList.toggle('focus', self.isFocused);
      wrap_classList.toggle('disabled', self.isDisabled);
      wrap_classList.toggle('required', self.isRequired);
      wrap_classList.toggle('invalid', !self.isValid);
      wrap_classList.toggle('locked', isLocked);
      wrap_classList.toggle('full', isFull);
      wrap_classList.toggle('input-active', self.isFocused && !self.isInputHidden);
      wrap_classList.toggle('dropdown-active', self.isOpen);
      wrap_classList.toggle('has-options', isEmptyObject(self.options));
      wrap_classList.toggle('has-items', self.items.length > 0);
    }
    /**
     * Update the `required` attribute of both input and control input.
     *
     * The `required` property needs to be activated on the control input
     * for the error to be displayed at the right place. `required` also
     * needs to be temporarily deactivated on the input since the input is
     * hidden and can't show errors.
     */


    refreshValidityState() {
      var self = this;

      if (!self.input.validity) {
        return;
      }

      self.isValid = self.input.validity.valid;
      self.isInvalid = !self.isValid;
    }
    /**
     * Determines whether or not more items can be added
     * to the control without exceeding the user-defined maximum.
     *
     * @returns {boolean}
     */


    isFull() {
      return this.settings.maxItems !== null && this.items.length >= this.settings.maxItems;
    }
    /**
     * Refreshes the original <select> or <input>
     * element to reflect the current state.
     *
     */


    updateOriginalInput(opts = {}) {
      const self = this;
      var option, label;
      const empty_option = self.input.querySelector('option[value=""]');

      if (self.is_select_tag) {
        const selected = [];
        const has_selected = self.input.querySelectorAll('option:checked').length;

        function AddSelected(option_el, value, label) {
          if (!option_el) {
            option_el = getDom('<option value="' + escape_html(value) + '">' + escape_html(label) + '</option>');
          } // don't move empty option from top of list
          // fixes bug in firefox https://bugzilla.mozilla.org/show_bug.cgi?id=1725293


          if (option_el != empty_option) {
            self.input.append(option_el);
          }

          selected.push(option_el); // marking empty option as selected can break validation
          // fixes https://github.com/orchidjs/tom-select/issues/303

          if (option_el != empty_option || has_selected > 0) {
            option_el.selected = true;
          }

          return option_el;
        } // unselect all selected options


        self.input.querySelectorAll('option:checked').forEach(option_el => {
          option_el.selected = false;
        }); // nothing selected?

        if (self.items.length == 0 && self.settings.mode == 'single') {
          AddSelected(empty_option, "", ""); // order selected <option> tags for values in self.items
        } else {
          self.items.forEach(value => {
            option = self.options[value];
            label = option[self.settings.labelField] || '';

            if (selected.includes(option.$option)) {
              const reuse_opt = self.input.querySelector(`option[value="${addSlashes(value)}"]:not(:checked)`);
              AddSelected(reuse_opt, value, label);
            } else {
              option.$option = AddSelected(option.$option, value, label);
            }
          });
        }
      } else {
        self.input.value = self.getValue();
      }

      if (self.isSetup) {
        if (!opts.silent) {
          self.trigger('change', self.getValue());
        }
      }
    }
    /**
     * Shows the autocomplete dropdown containing
     * the available options.
     */


    open() {
      var self = this;
      if (self.isLocked || self.isOpen || self.settings.mode === 'multi' && self.isFull()) return;
      self.isOpen = true;
      setAttr$1(self.focus_node, {
        'aria-expanded': 'true'
      });
      self.refreshState();
      applyCSS(self.dropdown, {
        visibility: 'hidden',
        display: 'block'
      });
      self.positionDropdown();
      applyCSS(self.dropdown, {
        visibility: 'visible',
        display: 'block'
      });
      self.focus();
      self.trigger('dropdown_open', self.dropdown);
    }
    /**
     * Closes the autocomplete dropdown menu.
     */


    close(setTextboxValue = true) {
      var self = this;
      var trigger = self.isOpen;

      if (setTextboxValue) {
        // before blur() to prevent form onchange event
        self.setTextboxValue();

        if (self.settings.mode === 'single' && self.items.length) {
          self.hideInput();
        }
      }

      self.isOpen = false;
      setAttr$1(self.focus_node, {
        'aria-expanded': 'false'
      });
      applyCSS(self.dropdown, {
        display: 'none'
      });

      if (self.settings.hideSelected) {
        self.clearActiveOption();
      }

      self.refreshState();
      if (trigger) self.trigger('dropdown_close', self.dropdown);
    }
    /**
     * Calculates and applies the appropriate
     * position of the dropdown if dropdownParent = 'body'.
     * Otherwise, position is determined by css
     */


    positionDropdown() {
      if (this.settings.dropdownParent !== 'body') {
        return;
      }

      var context = this.control;
      var rect = context.getBoundingClientRect();
      var top = context.offsetHeight + rect.top + window.scrollY;
      var left = rect.left + window.scrollX;
      applyCSS(this.dropdown, {
        width: rect.width + 'px',
        top: top + 'px',
        left: left + 'px'
      });
    }
    /**
     * Resets / clears all selected items
     * from the control.
     *
     */


    clear(silent) {
      var self = this;
      if (!self.items.length) return;
      var items = self.controlChildren();
      iterate$1(items, item => {
        self.removeItem(item, true);
      });
      self.showInput();
      if (!silent) self.updateOriginalInput();
      self.trigger('clear');
    }
    /**
     * A helper method for inserting an element
     * at the current caret position.
     *
     */


    insertAtCaret(el) {
      const self = this;
      const caret = self.caretPos;
      const target = self.control;
      target.insertBefore(el, target.children[caret] || null);
      self.setCaret(caret + 1);
    }
    /**
     * Removes the current selected item(s).
     *
     */


    deleteSelection(e) {
      var direction, selection, caret, tail;
      var self = this;
      direction = e && e.keyCode === KEY_BACKSPACE ? -1 : 1;
      selection = getSelection(self.control_input); // determine items that will be removed

      const rm_items = [];

      if (self.activeItems.length) {
        tail = getTail(self.activeItems, direction);
        caret = nodeIndex(tail);

        if (direction > 0) {
          caret++;
        }

        iterate$1(self.activeItems, item => rm_items.push(item));
      } else if ((self.isFocused || self.settings.mode === 'single') && self.items.length) {
        const items = self.controlChildren();
        let rm_item;

        if (direction < 0 && selection.start === 0 && selection.length === 0) {
          rm_item = items[self.caretPos - 1];
        } else if (direction > 0 && selection.start === self.inputValue().length) {
          rm_item = items[self.caretPos];
        }

        if (rm_item !== undefined) {
          rm_items.push(rm_item);
        }
      }

      if (!self.shouldDelete(rm_items, e)) {
        return false;
      }

      preventDefault(e, true); // perform removal

      if (typeof caret !== 'undefined') {
        self.setCaret(caret);
      }

      while (rm_items.length) {
        self.removeItem(rm_items.pop());
      }

      self.showInput();
      self.positionDropdown();
      self.refreshOptions(false);
      return true;
    }
    /**
     * Return true if the items should be deleted
     */


    shouldDelete(items, evt) {
      const values = items.map(item => item.dataset.value); // allow the callback to abort

      if (!values.length || typeof this.settings.onDelete === 'function' && this.settings.onDelete(values, evt) === false) {
        return false;
      }

      return true;
    }
    /**
     * Selects the previous / next item (depending on the `direction` argument).
     *
     * > 0 - right
     * < 0 - left
     *
     */


    advanceSelection(direction, e) {
      var last_active,
          adjacent,
          self = this;
      if (self.rtl) direction *= -1;
      if (self.inputValue().length) return; // add or remove to active items

      if (isKeyDown(KEY_SHORTCUT, e) || isKeyDown('shiftKey', e)) {
        last_active = self.getLastActive(direction);

        if (last_active) {
          if (!last_active.classList.contains('active')) {
            adjacent = last_active;
          } else {
            adjacent = self.getAdjacent(last_active, direction, 'item');
          } // if no active item, get items adjacent to the control input

        } else if (direction > 0) {
          adjacent = self.control_input.nextElementSibling;
        } else {
          adjacent = self.control_input.previousElementSibling;
        }

        if (adjacent) {
          if (adjacent.classList.contains('active')) {
            self.removeActiveItem(last_active);
          }

          self.setActiveItemClass(adjacent); // mark as last_active !! after removeActiveItem() on last_active
        } // move caret to the left or right

      } else {
        self.moveCaret(direction);
      }
    }

    moveCaret(direction) {}
    /**
     * Get the last active item
     *
     */


    getLastActive(direction) {
      let last_active = this.control.querySelector('.last-active');

      if (last_active) {
        return last_active;
      }

      var result = this.control.querySelectorAll('.active');

      if (result) {
        return getTail(result, direction);
      }
    }
    /**
     * Moves the caret to the specified index.
     *
     * The input must be moved by leaving it in place and moving the
     * siblings, due to the fact that focus cannot be restored once lost
     * on mobile webkit devices
     *
     */


    setCaret(new_pos) {
      this.caretPos = this.items.length;
    }
    /**
     * Return list of item dom elements
     *
     */


    controlChildren() {
      return Array.from(this.control.querySelectorAll('[data-ts-item]'));
    }
    /**
     * Disables user input on the control. Used while
     * items are being asynchronously created.
     */


    lock() {
      this.isLocked = true;
      this.refreshState();
    }
    /**
     * Re-enables user input on the control.
     */


    unlock() {
      this.isLocked = false;
      this.refreshState();
    }
    /**
     * Disables user input on the control completely.
     * While disabled, it cannot receive focus.
     */


    disable() {
      var self = this;
      self.input.disabled = true;
      self.control_input.disabled = true;
      self.focus_node.tabIndex = -1;
      self.isDisabled = true;
      this.close();
      self.lock();
    }
    /**
     * Enables the control so that it can respond
     * to focus and user input.
     */


    enable() {
      var self = this;
      self.input.disabled = false;
      self.control_input.disabled = false;
      self.focus_node.tabIndex = self.tabIndex;
      self.isDisabled = false;
      self.unlock();
    }
    /**
     * Completely destroys the control and
     * unbinds all event listeners so that it can
     * be garbage collected.
     */


    destroy() {
      var self = this;
      var revertSettings = self.revertSettings;
      self.trigger('destroy');
      self.off();
      self.wrapper.remove();
      self.dropdown.remove();
      self.input.innerHTML = revertSettings.innerHTML;
      self.input.tabIndex = revertSettings.tabIndex;
      removeClasses(self.input, 'tomselected', 'ts-hidden-accessible');

      self._destroy();

      delete self.input.tomselect;
    }
    /**
     * A helper method for rendering "item" and
     * "option" templates, given the data.
     *
     */


    render(templateName, data) {
      var id, html;
      const self = this;

      if (typeof this.settings.render[templateName] !== 'function') {
        return null;
      } // render markup


      html = self.settings.render[templateName].call(this, data, escape_html);

      if (!html) {
        return null;
      }

      html = getDom(html); // add mandatory attributes

      if (templateName === 'option' || templateName === 'option_create') {
        if (data[self.settings.disabledField]) {
          setAttr$1(html, {
            'aria-disabled': 'true'
          });
        } else {
          setAttr$1(html, {
            'data-selectable': ''
          });
        }
      } else if (templateName === 'optgroup') {
        id = data.group[self.settings.optgroupValueField];
        setAttr$1(html, {
          'data-group': id
        });

        if (data.group[self.settings.disabledField]) {
          setAttr$1(html, {
            'data-disabled': ''
          });
        }
      }

      if (templateName === 'option' || templateName === 'item') {
        const value = get_hash(data[self.settings.valueField]);
        setAttr$1(html, {
          'data-value': value
        }); // make sure we have some classes if a template is overwritten

        if (templateName === 'item') {
          addClasses(html, self.settings.itemClass);
          setAttr$1(html, {
            'data-ts-item': ''
          });
        } else {
          addClasses(html, self.settings.optionClass);
          setAttr$1(html, {
            role: 'option',
            id: data.$id
          }); // update cache

          data.$div = html;
          self.options[value] = data;
        }
      }

      return html;
    }
    /**
     * Type guarded rendering
     *
     */


    _render(templateName, data) {
      const html = this.render(templateName, data);

      if (html == null) {
        throw 'HTMLElement expected';
      }

      return html;
    }
    /**
     * Clears the render cache for a template. If
     * no template is given, clears all render
     * caches.
     *
     */


    clearCache() {
      iterate$1(this.options, option => {
        if (option.$div) {
          option.$div.remove();
          delete option.$div;
        }
      });
    }
    /**
     * Removes a value from item and option caches
     *
     */


    uncacheValue(value) {
      const option_el = this.getOption(value);
      if (option_el) option_el.remove();
    }
    /**
     * Determines whether or not to display the
     * create item prompt, given a user input.
     *
     */


    canCreate(input) {
      return this.settings.create && input.length > 0 && this.settings.createFilter.call(this, input);
    }
    /**
     * Wraps this.`method` so that `new_fn` can be invoked 'before', 'after', or 'instead' of the original method
     *
     * this.hook('instead','onKeyDown',function( arg1, arg2 ...){
     *
     * });
     */


    hook(when, method, new_fn) {
      var self = this;
      var orig_method = self[method];

      self[method] = function () {
        var result, result_new;

        if (when === 'after') {
          result = orig_method.apply(self, arguments);
        }

        result_new = new_fn.apply(self, arguments);

        if (when === 'instead') {
          return result_new;
        }

        if (when === 'before') {
          result = orig_method.apply(self, arguments);
        }

        return result;
      };
    }

  }

  /**
   * Plugin: "change_listener" (Tom Select)
   * Copyright (c) contributors
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   */
  function change_listener () {
    addEvent(this.input, 'change', () => {
      this.sync();
    });
  }

  /**
   * Plugin: "restore_on_backspace" (Tom Select)
   * Copyright (c) contributors
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   */
  function checkbox_options () {
    var self = this;
    var orig_onOptionSelect = self.onOptionSelect;
    self.settings.hideSelected = false; // update the checkbox for an option

    var UpdateCheckbox = function UpdateCheckbox(option) {
      setTimeout(() => {
        var checkbox = option.querySelector('input');

        if (checkbox instanceof HTMLInputElement) {
          if (option.classList.contains('selected')) {
            checkbox.checked = true;
          } else {
            checkbox.checked = false;
          }
        }
      }, 1);
    }; // add checkbox to option template


    self.hook('after', 'setupTemplates', () => {
      var orig_render_option = self.settings.render.option;

      self.settings.render.option = (data, escape_html) => {
        var rendered = getDom(orig_render_option.call(self, data, escape_html));
        var checkbox = document.createElement('input');
        checkbox.addEventListener('click', function (evt) {
          preventDefault(evt);
        });
        checkbox.type = 'checkbox';
        const hashed = hash_key(data[self.settings.valueField]);

        if (hashed && self.items.indexOf(hashed) > -1) {
          checkbox.checked = true;
        }

        rendered.prepend(checkbox);
        return rendered;
      };
    }); // uncheck when item removed

    self.on('item_remove', value => {
      var option = self.getOption(value);

      if (option) {
        // if dropdown hasn't been opened yet, the option won't exist
        option.classList.remove('selected'); // selected class won't be removed yet

        UpdateCheckbox(option);
      }
    }); // check when item added

    self.on('item_add', value => {
      var option = self.getOption(value);

      if (option) {
        // if dropdown hasn't been opened yet, the option won't exist
        UpdateCheckbox(option);
      }
    }); // remove items when selected option is clicked

    self.hook('instead', 'onOptionSelect', (evt, option) => {
      if (option.classList.contains('selected')) {
        option.classList.remove('selected');
        self.removeItem(option.dataset.value);
        self.refreshOptions();
        preventDefault(evt, true);
        return;
      }

      orig_onOptionSelect.call(self, evt, option);
      UpdateCheckbox(option);
    });
  }

  /**
   * Plugin: "dropdown_header" (Tom Select)
   * Copyright (c) contributors
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   */
  function clear_button (userOptions) {
    const self = this;
    const options = Object.assign({
      className: 'clear-button',
      title: 'Clear All',
      html: data => {
        return `<div class="${data.className}" title="${data.title}">&#10799;</div>`;
      }
    }, userOptions);
    self.on('initialize', () => {
      var button = getDom(options.html(options));
      button.addEventListener('click', evt => {
        if (self.isDisabled) {
          return;
        }

        self.clear();

        if (self.settings.mode === 'single' && self.settings.allowEmptyOption) {
          self.addItem('');
        }

        evt.preventDefault();
        evt.stopPropagation();
      });
      self.control.appendChild(button);
    });
  }

  /**
   * Plugin: "drag_drop" (Tom Select)
   * Copyright (c) contributors
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   */
  function drag_drop () {
    var self = this;
    if (!$.fn.sortable) throw new Error('The "drag_drop" plugin requires jQuery UI "sortable".');
    if (self.settings.mode !== 'multi') return;
    var orig_lock = self.lock;
    var orig_unlock = self.unlock;
    self.hook('instead', 'lock', () => {
      var sortable = $(self.control).data('sortable');
      if (sortable) sortable.disable();
      return orig_lock.call(self);
    });
    self.hook('instead', 'unlock', () => {
      var sortable = $(self.control).data('sortable');
      if (sortable) sortable.enable();
      return orig_unlock.call(self);
    });
    self.on('initialize', () => {
      var $control = $(self.control).sortable({
        items: '[data-value]',
        forcePlaceholderSize: true,
        disabled: self.isLocked,
        start: (e, ui) => {
          ui.placeholder.css('width', ui.helper.css('width'));
          $control.css({
            overflow: 'visible'
          });
        },
        stop: () => {
          $control.css({
            overflow: 'hidden'
          });
          var values = [];
          $control.children('[data-value]').each(function () {
            if (this.dataset.value) values.push(this.dataset.value);
          });
          self.setValue(values);
        }
      });
    });
  }

  /**
   * Plugin: "dropdown_header" (Tom Select)
   * Copyright (c) contributors
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   */
  function dropdown_header (userOptions) {
    const self = this;
    const options = Object.assign({
      title: 'Untitled',
      headerClass: 'dropdown-header',
      titleRowClass: 'dropdown-header-title',
      labelClass: 'dropdown-header-label',
      closeClass: 'dropdown-header-close',
      html: data => {
        return '<div class="' + data.headerClass + '">' + '<div class="' + data.titleRowClass + '">' + '<span class="' + data.labelClass + '">' + data.title + '</span>' + '<a class="' + data.closeClass + '">&times;</a>' + '</div>' + '</div>';
      }
    }, userOptions);
    self.on('initialize', () => {
      var header = getDom(options.html(options));
      var close_link = header.querySelector('.' + options.closeClass);

      if (close_link) {
        close_link.addEventListener('click', evt => {
          preventDefault(evt, true);
          self.close();
        });
      }

      self.dropdown.insertBefore(header, self.dropdown.firstChild);
    });
  }

  /**
   * Plugin: "dropdown_input" (Tom Select)
   * Copyright (c) contributors
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   */
  function caret_position () {
    var self = this;
    /**
     * Moves the caret to the specified index.
     *
     * The input must be moved by leaving it in place and moving the
     * siblings, due to the fact that focus cannot be restored once lost
     * on mobile webkit devices
     *
     */

    self.hook('instead', 'setCaret', new_pos => {
      if (self.settings.mode === 'single' || !self.control.contains(self.control_input)) {
        new_pos = self.items.length;
      } else {
        new_pos = Math.max(0, Math.min(self.items.length, new_pos));

        if (new_pos != self.caretPos && !self.isPending) {
          self.controlChildren().forEach((child, j) => {
            if (j < new_pos) {
              self.control_input.insertAdjacentElement('beforebegin', child);
            } else {
              self.control.appendChild(child);
            }
          });
        }
      }

      self.caretPos = new_pos;
    });
    self.hook('instead', 'moveCaret', direction => {
      if (!self.isFocused) return; // move caret before or after selected items

      const last_active = self.getLastActive(direction);

      if (last_active) {
        const idx = nodeIndex(last_active);
        self.setCaret(direction > 0 ? idx + 1 : idx);
        self.setActiveItem();
        removeClasses(last_active, 'last-active'); // move caret left or right of current position
      } else {
        self.setCaret(self.caretPos + direction);
      }
    });
  }

  /**
   * Plugin: "dropdown_input" (Tom Select)
   * Copyright (c) contributors
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   */
  function dropdown_input () {
    const self = this;
    self.settings.shouldOpen = true; // make sure the input is shown even if there are no options to display in the dropdown

    self.hook('before', 'setup', () => {
      self.focus_node = self.control;
      addClasses(self.control_input, 'dropdown-input');
      const div = getDom('<div class="dropdown-input-wrap">');
      div.append(self.control_input);
      self.dropdown.insertBefore(div, self.dropdown.firstChild); // set a placeholder in the select control

      const placeholder = getDom('<input class="items-placeholder" tabindex="-1" />');
      placeholder.placeholder = self.settings.placeholder || '';
      self.control.append(placeholder);
    });
    self.on('initialize', () => {
      // set tabIndex on control to -1, otherwise [shift+tab] will put focus right back on control_input
      self.control_input.addEventListener('keydown', evt => {
        //addEvent(self.control_input,'keydown' as const,(evt:KeyboardEvent) =>{
        switch (evt.keyCode) {
          case KEY_ESC:
            if (self.isOpen) {
              preventDefault(evt, true);
              self.close();
            }

            self.clearActiveItems();
            return;

          case KEY_TAB:
            self.focus_node.tabIndex = -1;
            break;
        }

        return self.onKeyDown.call(self, evt);
      });
      self.on('blur', () => {
        self.focus_node.tabIndex = self.isDisabled ? -1 : self.tabIndex;
      }); // give the control_input focus when the dropdown is open

      self.on('dropdown_open', () => {
        self.control_input.focus();
      }); // prevent onBlur from closing when focus is on the control_input

      const orig_onBlur = self.onBlur;
      self.hook('instead', 'onBlur', evt => {
        if (evt && evt.relatedTarget == self.control_input) return;
        return orig_onBlur.call(self);
      });
      addEvent(self.control_input, 'blur', () => self.onBlur()); // return focus to control to allow further keyboard input

      self.hook('before', 'close', () => {
        if (!self.isOpen) return;
        self.focus_node.focus({
          preventScroll: true
        });
      });
    });
  }

  /**
   * Plugin: "input_autogrow" (Tom Select)
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   */
  function input_autogrow () {
    var self = this;
    self.on('initialize', () => {
      var test_input = document.createElement('span');
      var control = self.control_input;
      test_input.style.cssText = 'position:absolute; top:-99999px; left:-99999px; width:auto; padding:0; white-space:pre; ';
      self.wrapper.appendChild(test_input);
      var transfer_styles = ['letterSpacing', 'fontSize', 'fontFamily', 'fontWeight', 'textTransform'];

      for (const style_name of transfer_styles) {
        // @ts-ignore TS7015 https://stackoverflow.com/a/50506154/697576
        test_input.style[style_name] = control.style[style_name];
      }
      /**
       * Set the control width
       *
       */


      var resize = () => {
        test_input.textContent = control.value;
        control.style.width = test_input.clientWidth + 'px';
      };

      resize();
      self.on('update item_add item_remove', resize);
      addEvent(control, 'input', resize);
      addEvent(control, 'keyup', resize);
      addEvent(control, 'blur', resize);
      addEvent(control, 'update', resize);
    });
  }

  /**
   * Plugin: "input_autogrow" (Tom Select)
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   */
  function no_backspace_delete () {
    var self = this;
    var orig_deleteSelection = self.deleteSelection;
    this.hook('instead', 'deleteSelection', evt => {
      if (self.activeItems.length) {
        return orig_deleteSelection.call(self, evt);
      }

      return false;
    });
  }

  /**
   * Plugin: "no_active_items" (Tom Select)
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   */
  function no_active_items () {
    this.hook('instead', 'setActiveItem', () => {});
    this.hook('instead', 'selectAll', () => {});
  }

  /**
   * Plugin: "optgroup_columns" (Tom Select.js)
   * Copyright (c) contributors
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   */
  function optgroup_columns () {
    var self = this;
    var orig_keydown = self.onKeyDown;
    self.hook('instead', 'onKeyDown', evt => {
      var index, option, options, optgroup;

      if (!self.isOpen || !(evt.keyCode === KEY_LEFT || evt.keyCode === KEY_RIGHT)) {
        return orig_keydown.call(self, evt);
      }

      self.ignoreHover = true;
      optgroup = parentMatch(self.activeOption, '[data-group]');
      index = nodeIndex(self.activeOption, '[data-selectable]');

      if (!optgroup) {
        return;
      }

      if (evt.keyCode === KEY_LEFT) {
        optgroup = optgroup.previousSibling;
      } else {
        optgroup = optgroup.nextSibling;
      }

      if (!optgroup) {
        return;
      }

      options = optgroup.querySelectorAll('[data-selectable]');
      option = options[Math.min(options.length - 1, index)];

      if (option) {
        self.setActiveOption(option);
      }
    });
  }

  /**
   * Plugin: "remove_button" (Tom Select)
   * Copyright (c) contributors
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   */
  function remove_button (userOptions) {
    const options = Object.assign({
      label: '&times;',
      title: 'Remove',
      className: 'remove',
      append: true
    }, userOptions); //options.className = 'remove-single';

    var self = this; // override the render method to add remove button to each item

    if (!options.append) {
      return;
    }

    var html = '<a href="javascript:void(0)" class="' + options.className + '" tabindex="-1" title="' + escape_html(options.title) + '">' + options.label + '</a>';
    self.hook('after', 'setupTemplates', () => {
      var orig_render_item = self.settings.render.item;

      self.settings.render.item = (data, escape) => {
        var item = getDom(orig_render_item.call(self, data, escape));
        var close_button = getDom(html);
        item.appendChild(close_button);
        addEvent(close_button, 'mousedown', evt => {
          preventDefault(evt, true);
        });
        addEvent(close_button, 'click', evt => {
          // propagating will trigger the dropdown to show for single mode
          preventDefault(evt, true);
          if (self.isLocked) return;
          if (!self.shouldDelete([item], evt)) return;
          self.removeItem(item);
          self.refreshOptions(false);
          self.inputState();
        });
        return item;
      };
    });
  }

  /**
   * Plugin: "restore_on_backspace" (Tom Select)
   * Copyright (c) contributors
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   */
  function restore_on_backspace (userOptions) {
    const self = this;
    const options = Object.assign({
      text: option => {
        return option[self.settings.labelField];
      }
    }, userOptions);
    self.on('item_remove', function (value) {
      if (!self.isFocused) {
        return;
      }

      if (self.control_input.value.trim() === '') {
        var option = self.options[value];

        if (option) {
          self.setTextboxValue(options.text.call(self, option));
        }
      }
    });
  }

  /**
   * Plugin: "restore_on_backspace" (Tom Select)
   * Copyright (c) contributors
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   * file except in compliance with the License. You may obtain a copy of the License at:
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   * ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   *
   */
  function virtual_scroll () {
    const self = this;
    const orig_canLoad = self.canLoad;
    const orig_clearActiveOption = self.clearActiveOption;
    const orig_loadCallback = self.loadCallback;
    var pagination = {};
    var dropdown_content;
    var loading_more = false;
    var load_more_opt;
    var default_values = [];

    if (!self.settings.shouldLoadMore) {
      // return true if additional results should be loaded
      self.settings.shouldLoadMore = () => {
        const scroll_percent = dropdown_content.clientHeight / (dropdown_content.scrollHeight - dropdown_content.scrollTop);

        if (scroll_percent > 0.9) {
          return true;
        }

        if (self.activeOption) {
          var selectable = self.selectable();
          var index = Array.from(selectable).indexOf(self.activeOption);

          if (index >= selectable.length - 2) {
            return true;
          }
        }

        return false;
      };
    }

    if (!self.settings.firstUrl) {
      throw 'virtual_scroll plugin requires a firstUrl() method';
    } // in order for virtual scrolling to work,
    // options need to be ordered the same way they're returned from the remote data source


    self.settings.sortField = [{
      field: '$order'
    }, {
      field: '$score'
    }]; // can we load more results for given query?

    const canLoadMore = query => {
      if (typeof self.settings.maxOptions === 'number' && dropdown_content.children.length >= self.settings.maxOptions) {
        return false;
      }

      if (query in pagination && pagination[query]) {
        return true;
      }

      return false;
    };

    const clearFilter = (option, value) => {
      if (self.items.indexOf(value) >= 0 || default_values.indexOf(value) >= 0) {
        return true;
      }

      return false;
    }; // set the next url that will be


    self.setNextUrl = (value, next_url) => {
      pagination[value] = next_url;
    }; // getUrl() to be used in settings.load()


    self.getUrl = query => {
      if (query in pagination) {
        const next_url = pagination[query];
        pagination[query] = false;
        return next_url;
      } // if the user goes back to a previous query
      // we need to load the first page again


      pagination = {};
      return self.settings.firstUrl.call(self, query);
    }; // don't clear the active option (and cause unwanted dropdown scroll)
    // while loading more results


    self.hook('instead', 'clearActiveOption', () => {
      if (loading_more) {
        return;
      }

      return orig_clearActiveOption.call(self);
    }); // override the canLoad method

    self.hook('instead', 'canLoad', query => {
      // first time the query has been seen
      if (!(query in pagination)) {
        return orig_canLoad.call(self, query);
      }

      return canLoadMore(query);
    }); // wrap the load

    self.hook('instead', 'loadCallback', (options, optgroups) => {
      if (!loading_more) {
        self.clearOptions(clearFilter);
      } else if (load_more_opt) {
        const first_option = options[0];

        if (first_option !== undefined) {
          load_more_opt.dataset.value = first_option[self.settings.valueField];
        }
      }

      orig_loadCallback.call(self, options, optgroups);
      loading_more = false;
    }); // add templates to dropdown
    //	loading_more if we have another url in the queue
    //	no_more_results if we don't have another url in the queue

    self.hook('after', 'refreshOptions', () => {
      const query = self.lastValue;
      var option;

      if (canLoadMore(query)) {
        option = self.render('loading_more', {
          query: query
        });

        if (option) {
          option.setAttribute('data-selectable', ''); // so that navigating dropdown with [down] keypresses can navigate to this node

          load_more_opt = option;
        }
      } else if (query in pagination && !dropdown_content.querySelector('.no-results')) {
        option = self.render('no_more_results', {
          query: query
        });
      }

      if (option) {
        addClasses(option, self.settings.optionClass);
        dropdown_content.append(option);
      }
    }); // add scroll listener and default templates

    self.on('initialize', () => {
      default_values = Object.keys(self.options);
      dropdown_content = self.dropdown_content; // default templates

      self.settings.render = Object.assign({}, {
        loading_more: () => {
          return `<div class="loading-more-results">Loading more results ... </div>`;
        },
        no_more_results: () => {
          return `<div class="no-more-results">No more results</div>`;
        }
      }, self.settings.render); // watch dropdown content scroll position

      dropdown_content.addEventListener('scroll', () => {
        if (!self.settings.shouldLoadMore.call(self)) {
          return;
        } // !important: this will get checked again in load() but we still need to check here otherwise loading_more will be set to true


        if (!canLoadMore(self.lastValue)) {
          return;
        } // don't call load() too much


        if (loading_more) return;
        loading_more = true;
        self.load.call(self, self.lastValue);
      });
    });
  }

  TomSelect.define('change_listener', change_listener);
  TomSelect.define('checkbox_options', checkbox_options);
  TomSelect.define('clear_button', clear_button);
  TomSelect.define('drag_drop', drag_drop);
  TomSelect.define('dropdown_header', dropdown_header);
  TomSelect.define('caret_position', caret_position);
  TomSelect.define('dropdown_input', dropdown_input);
  TomSelect.define('input_autogrow', input_autogrow);
  TomSelect.define('no_backspace_delete', no_backspace_delete);
  TomSelect.define('no_active_items', no_active_items);
  TomSelect.define('optgroup_columns', optgroup_columns);
  TomSelect.define('remove_button', remove_button);
  TomSelect.define('restore_on_backspace', restore_on_backspace);
  TomSelect.define('virtual_scroll', virtual_scroll);

  function AutoComplete(Alpine){

    Alpine.directive('auto-complete', (el, {value, modifiers, expression, }, {Alpine, effect, evaluate, evaluateLater})=>{

      
     });
    Alpine.directive('auto-complete-settings', (el, {value, modifiers, expression, }, {Alpine, effect, evaluate, evaluateLater})=>{

      let settings  = evaluate(expression);
      console.log(settings);
      let input = el.querySelector('input');
      new TomSelect(input, {
          maxItems: null,
          valueField: 'value',
          labelField: 'text',
          searchField: 'text',
          options: evaluate("items"),
          items: evaluate('values'),
          persist: false,
          createOnBlur: true,
          create: true,
          ...settings,
      });
      

      
      
      Alpine.bind(el, {
        "u-init"(){
          let tomSelect = document.getElementById(this.id).querySelector('input');
          tomSelect = tomSelect.tomselect;
          
          tomSelect.on('change', (val)=>{
            this.values = val.split(',');
            tomSelect.addOptions(this.items, true);
            tomSelect.refreshOptions();
          });
          tomSelect.on('option_add', (value, data)=>{
            let set = new Set(this.items);
            set.add(data);
            this.items = Array.from(set);
            tomSelect.addOptions(this.items, true);
            tomSelect.refreshOptions();
          });
        }
      });
     });


    

  }

  function Modal(Alpine) {
    Alpine.directive('modal-backdrop', (el) => {
      Alpine.bind(el, {
        'u-on:click'() {
          const isOpen = el.parentNode.hasAttribute('u-modal-open');

          if(isOpen) {
            this.$modal.close();
          }
        }
      });
    });

    Alpine.directive('modal-content', (el) => {
      Alpine.bind(el, {
        'u-on:click.stop'() {
          // 
        }
      });
    });

    Alpine.directive('modal', el => {

      Alpine.bind(el, {
        'u-data'() {
          return {
            close() {
              el.removeAttribute('u-modal-open');
            },
          }
        }
      });
    });

    Alpine.magic('modal', (...args) => {
      return {
        open(name) {
          const el = document.querySelector(`[name="${name}"]`);

          el.setAttribute('u-modal-open', '');
        },
        close() {

          const el = document.querySelector(`[u-modal-open]`);

          if(el) {
            el.removeAttribute('u-modal-open');
          }
        }
      }
    });
  }

  var DOCUMENT_FRAGMENT_NODE = 11;

  function morphAttrs(fromNode, toNode) {
      var toNodeAttrs = toNode.attributes;
      var attr;
      var attrName;
      var attrNamespaceURI;
      var attrValue;
      var fromValue;

      // document-fragments dont have attributes so lets not do anything
      if (toNode.nodeType === DOCUMENT_FRAGMENT_NODE || fromNode.nodeType === DOCUMENT_FRAGMENT_NODE) {
        return;
      }

      // update attributes on original DOM element
      for (var i = toNodeAttrs.length - 1; i >= 0; i--) {
          attr = toNodeAttrs[i];
          attrName = attr.name;
          attrNamespaceURI = attr.namespaceURI;
          attrValue = attr.value;

          if (attrNamespaceURI) {
              attrName = attr.localName || attrName;
              fromValue = fromNode.getAttributeNS(attrNamespaceURI, attrName);

              if (fromValue !== attrValue) {
                  if (attr.prefix === 'xmlns'){
                      attrName = attr.name; // It's not allowed to set an attribute with the XMLNS namespace without specifying the `xmlns` prefix
                  }
                  fromNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
              }
          } else {
              fromValue = fromNode.getAttribute(attrName);

              if (fromValue !== attrValue) {
                  fromNode.setAttribute(attrName, attrValue);
              }
          }
      }

      // Remove any extra attributes found on the original DOM element that
      // weren't found on the target element.
      var fromNodeAttrs = fromNode.attributes;

      for (var d = fromNodeAttrs.length - 1; d >= 0; d--) {
          attr = fromNodeAttrs[d];
          attrName = attr.name;
          attrNamespaceURI = attr.namespaceURI;

          if (attrNamespaceURI) {
              attrName = attr.localName || attrName;

              if (!toNode.hasAttributeNS(attrNamespaceURI, attrName)) {
                  fromNode.removeAttributeNS(attrNamespaceURI, attrName);
              }
          } else {
              if (!toNode.hasAttribute(attrName)) {
                  fromNode.removeAttribute(attrName);
              }
          }
      }
  }

  var range; // Create a range object for efficently rendering strings to elements.
  var NS_XHTML = 'http://www.w3.org/1999/xhtml';

  var doc = typeof document === 'undefined' ? undefined : document;
  var HAS_TEMPLATE_SUPPORT = !!doc && 'content' in doc.createElement('template');
  var HAS_RANGE_SUPPORT = !!doc && doc.createRange && 'createContextualFragment' in doc.createRange();

  function createFragmentFromTemplate(str) {
      var template = doc.createElement('template');
      template.innerHTML = str;
      return template.content.childNodes[0];
  }

  function createFragmentFromRange(str) {
      if (!range) {
          range = doc.createRange();
          range.selectNode(doc.body);
      }

      var fragment = range.createContextualFragment(str);
      return fragment.childNodes[0];
  }

  function createFragmentFromWrap(str) {
      var fragment = doc.createElement('body');
      fragment.innerHTML = str;
      return fragment.childNodes[0];
  }

  /**
   * This is about the same
   * var html = new DOMParser().parseFromString(str, 'text/html');
   * return html.body.firstChild;
   *
   * @method toElement
   * @param {String} str
   */
  function toElement(str) {
      str = str.trim();
      if (HAS_TEMPLATE_SUPPORT) {
        // avoid restrictions on content for things like `<tr><th>Hi</th></tr>` which
        // createContextualFragment doesn't support
        // <template> support not available in IE
        return createFragmentFromTemplate(str);
      } else if (HAS_RANGE_SUPPORT) {
        return createFragmentFromRange(str);
      }

      return createFragmentFromWrap(str);
  }

  /**
   * Returns true if two node's names are the same.
   *
   * NOTE: We don't bother checking `namespaceURI` because you will never find two HTML elements with the same
   *       nodeName and different namespace URIs.
   *
   * @param {Element} a
   * @param {Element} b The target element
   * @return {boolean}
   */
  function compareNodeNames(fromEl, toEl) {
      var fromNodeName = fromEl.nodeName;
      var toNodeName = toEl.nodeName;
      var fromCodeStart, toCodeStart;

      if (fromNodeName === toNodeName) {
          return true;
      }

      fromCodeStart = fromNodeName.charCodeAt(0);
      toCodeStart = toNodeName.charCodeAt(0);

      // If the target element is a virtual DOM node or SVG node then we may
      // need to normalize the tag name before comparing. Normal HTML elements that are
      // in the "http://www.w3.org/1999/xhtml"
      // are converted to upper case
      if (fromCodeStart <= 90 && toCodeStart >= 97) { // from is upper and to is lower
          return fromNodeName === toNodeName.toUpperCase();
      } else if (toCodeStart <= 90 && fromCodeStart >= 97) { // to is upper and from is lower
          return toNodeName === fromNodeName.toUpperCase();
      } else {
          return false;
      }
  }

  /**
   * Create an element, optionally with a known namespace URI.
   *
   * @param {string} name the element name, e.g. 'div' or 'svg'
   * @param {string} [namespaceURI] the element's namespace URI, i.e. the value of
   * its `xmlns` attribute or its inferred namespace.
   *
   * @return {Element}
   */
  function createElementNS(name, namespaceURI) {
      return !namespaceURI || namespaceURI === NS_XHTML ?
          doc.createElement(name) :
          doc.createElementNS(namespaceURI, name);
  }

  /**
   * Copies the children of one DOM element to another DOM element
   */
  function moveChildren(fromEl, toEl) {
      var curChild = fromEl.firstChild;
      while (curChild) {
          var nextChild = curChild.nextSibling;
          toEl.appendChild(curChild);
          curChild = nextChild;
      }
      return toEl;
  }

  function syncBooleanAttrProp(fromEl, toEl, name) {
      if (fromEl[name] !== toEl[name]) {
          fromEl[name] = toEl[name];
          if (fromEl[name]) {
              fromEl.setAttribute(name, '');
          } else {
              fromEl.removeAttribute(name);
          }
      }
  }

  var specialElHandlers = {
      OPTION: function(fromEl, toEl) {
          var parentNode = fromEl.parentNode;
          if (parentNode) {
              var parentName = parentNode.nodeName.toUpperCase();
              if (parentName === 'OPTGROUP') {
                  parentNode = parentNode.parentNode;
                  parentName = parentNode && parentNode.nodeName.toUpperCase();
              }
              if (parentName === 'SELECT' && !parentNode.hasAttribute('multiple')) {
                  if (fromEl.hasAttribute('selected') && !toEl.selected) {
                      // Workaround for MS Edge bug where the 'selected' attribute can only be
                      // removed if set to a non-empty value:
                      // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12087679/
                      fromEl.setAttribute('selected', 'selected');
                      fromEl.removeAttribute('selected');
                  }
                  // We have to reset select element's selectedIndex to -1, otherwise setting
                  // fromEl.selected using the syncBooleanAttrProp below has no effect.
                  // The correct selectedIndex will be set in the SELECT special handler below.
                  parentNode.selectedIndex = -1;
              }
          }
          syncBooleanAttrProp(fromEl, toEl, 'selected');
      },
      /**
       * The "value" attribute is special for the <input> element since it sets
       * the initial value. Changing the "value" attribute without changing the
       * "value" property will have no effect since it is only used to the set the
       * initial value.  Similar for the "checked" attribute, and "disabled".
       */
      INPUT: function(fromEl, toEl) {
          syncBooleanAttrProp(fromEl, toEl, 'checked');
          syncBooleanAttrProp(fromEl, toEl, 'disabled');

          if (fromEl.value !== toEl.value) {
              fromEl.value = toEl.value;
          }

          if (!toEl.hasAttribute('value')) {
              fromEl.removeAttribute('value');
          }
      },

      TEXTAREA: function(fromEl, toEl) {
          var newValue = toEl.value;
          if (fromEl.value !== newValue) {
              fromEl.value = newValue;
          }

          var firstChild = fromEl.firstChild;
          if (firstChild) {
              // Needed for IE. Apparently IE sets the placeholder as the
              // node value and vise versa. This ignores an empty update.
              var oldValue = firstChild.nodeValue;

              if (oldValue == newValue || (!newValue && oldValue == fromEl.placeholder)) {
                  return;
              }

              firstChild.nodeValue = newValue;
          }
      },
      SELECT: function(fromEl, toEl) {
          if (!toEl.hasAttribute('multiple')) {
              var selectedIndex = -1;
              var i = 0;
              // We have to loop through children of fromEl, not toEl since nodes can be moved
              // from toEl to fromEl directly when morphing.
              // At the time this special handler is invoked, all children have already been morphed
              // and appended to / removed from fromEl, so using fromEl here is safe and correct.
              var curChild = fromEl.firstChild;
              var optgroup;
              var nodeName;
              while(curChild) {
                  nodeName = curChild.nodeName && curChild.nodeName.toUpperCase();
                  if (nodeName === 'OPTGROUP') {
                      optgroup = curChild;
                      curChild = optgroup.firstChild;
                  } else {
                      if (nodeName === 'OPTION') {
                          if (curChild.hasAttribute('selected')) {
                              selectedIndex = i;
                              break;
                          }
                          i++;
                      }
                      curChild = curChild.nextSibling;
                      if (!curChild && optgroup) {
                          curChild = optgroup.nextSibling;
                          optgroup = null;
                      }
                  }
              }

              fromEl.selectedIndex = selectedIndex;
          }
      }
  };

  var ELEMENT_NODE = 1;
  var DOCUMENT_FRAGMENT_NODE$1 = 11;
  var TEXT_NODE = 3;
  var COMMENT_NODE = 8;

  function noop() {}

  function defaultGetNodeKey(node) {
    if (node) {
      return (node.getAttribute && node.getAttribute('id')) || node.id;
    }
  }

  function morphdomFactory(morphAttrs) {

    return function morphdom(fromNode, toNode, options) {
      if (!options) {
        options = {};
      }

      if (typeof toNode === 'string') {
        if (fromNode.nodeName === '#document' || fromNode.nodeName === 'HTML' || fromNode.nodeName === 'BODY') {
          var toNodeHtml = toNode;
          toNode = doc.createElement('html');
          toNode.innerHTML = toNodeHtml;
        } else {
          toNode = toElement(toNode);
        }
      } else if (toNode.nodeType === DOCUMENT_FRAGMENT_NODE$1) {
        toNode = toNode.firstElementChild;
      }

      var getNodeKey = options.getNodeKey || defaultGetNodeKey;
      var onBeforeNodeAdded = options.onBeforeNodeAdded || noop;
      var onNodeAdded = options.onNodeAdded || noop;
      var onBeforeElUpdated = options.onBeforeElUpdated || noop;
      var onElUpdated = options.onElUpdated || noop;
      var onBeforeNodeDiscarded = options.onBeforeNodeDiscarded || noop;
      var onNodeDiscarded = options.onNodeDiscarded || noop;
      var onBeforeElChildrenUpdated = options.onBeforeElChildrenUpdated || noop;
      var skipFromChildren = options.skipFromChildren || noop;
      var addChild = options.addChild || function(parent, child){ return parent.appendChild(child); };
      var childrenOnly = options.childrenOnly === true;

      // This object is used as a lookup to quickly find all keyed elements in the original DOM tree.
      var fromNodesLookup = Object.create(null);
      var keyedRemovalList = [];

      function addKeyedRemoval(key) {
        keyedRemovalList.push(key);
      }

      function walkDiscardedChildNodes(node, skipKeyedNodes) {
        if (node.nodeType === ELEMENT_NODE) {
          var curChild = node.firstChild;
          while (curChild) {

            var key = undefined;

            if (skipKeyedNodes && (key = getNodeKey(curChild))) {
              // If we are skipping keyed nodes then we add the key
              // to a list so that it can be handled at the very end.
              addKeyedRemoval(key);
            } else {
              // Only report the node as discarded if it is not keyed. We do this because
              // at the end we loop through all keyed elements that were unmatched
              // and then discard them in one final pass.
              onNodeDiscarded(curChild);
              if (curChild.firstChild) {
                walkDiscardedChildNodes(curChild, skipKeyedNodes);
              }
            }

            curChild = curChild.nextSibling;
          }
        }
      }

      /**
      * Removes a DOM node out of the original DOM
      *
      * @param  {Node} node The node to remove
      * @param  {Node} parentNode The nodes parent
      * @param  {Boolean} skipKeyedNodes If true then elements with keys will be skipped and not discarded.
      * @return {undefined}
      */
      function removeNode(node, parentNode, skipKeyedNodes) {
        if (onBeforeNodeDiscarded(node) === false) {
          return;
        }

        if (parentNode) {
          parentNode.removeChild(node);
        }

        onNodeDiscarded(node);
        walkDiscardedChildNodes(node, skipKeyedNodes);
      }

      // // TreeWalker implementation is no faster, but keeping this around in case this changes in the future
      // function indexTree(root) {
      //     var treeWalker = document.createTreeWalker(
      //         root,
      //         NodeFilter.SHOW_ELEMENT);
      //
      //     var el;
      //     while((el = treeWalker.nextNode())) {
      //         var key = getNodeKey(el);
      //         if (key) {
      //             fromNodesLookup[key] = el;
      //         }
      //     }
      // }

      // // NodeIterator implementation is no faster, but keeping this around in case this changes in the future
      //
      // function indexTree(node) {
      //     var nodeIterator = document.createNodeIterator(node, NodeFilter.SHOW_ELEMENT);
      //     var el;
      //     while((el = nodeIterator.nextNode())) {
      //         var key = getNodeKey(el);
      //         if (key) {
      //             fromNodesLookup[key] = el;
      //         }
      //     }
      // }

      function indexTree(node) {
        if (node.nodeType === ELEMENT_NODE || node.nodeType === DOCUMENT_FRAGMENT_NODE$1) {
          var curChild = node.firstChild;
          while (curChild) {
            var key = getNodeKey(curChild);
            if (key) {
              fromNodesLookup[key] = curChild;
            }

            // Walk recursively
            indexTree(curChild);

            curChild = curChild.nextSibling;
          }
        }
      }

      indexTree(fromNode);

      function handleNodeAdded(el) {
        onNodeAdded(el);

        var curChild = el.firstChild;
        while (curChild) {
          var nextSibling = curChild.nextSibling;

          var key = getNodeKey(curChild);
          if (key) {
            var unmatchedFromEl = fromNodesLookup[key];
            // if we find a duplicate #id node in cache, replace `el` with cache value
            // and morph it to the child node.
            if (unmatchedFromEl && compareNodeNames(curChild, unmatchedFromEl)) {
              curChild.parentNode.replaceChild(unmatchedFromEl, curChild);
              morphEl(unmatchedFromEl, curChild);
            } else {
              handleNodeAdded(curChild);
            }
          } else {
            // recursively call for curChild and it's children to see if we find something in
            // fromNodesLookup
            handleNodeAdded(curChild);
          }

          curChild = nextSibling;
        }
      }

      function cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey) {
        // We have processed all of the "to nodes". If curFromNodeChild is
        // non-null then we still have some from nodes left over that need
        // to be removed
        while (curFromNodeChild) {
          var fromNextSibling = curFromNodeChild.nextSibling;
          if ((curFromNodeKey = getNodeKey(curFromNodeChild))) {
            // Since the node is keyed it might be matched up later so we defer
            // the actual removal to later
            addKeyedRemoval(curFromNodeKey);
          } else {
            // NOTE: we skip nested keyed nodes from being removed since there is
            //       still a chance they will be matched up later
            removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
          }
          curFromNodeChild = fromNextSibling;
        }
      }

      function morphEl(fromEl, toEl, childrenOnly) {
        var toElKey = getNodeKey(toEl);

        if (toElKey) {
          // If an element with an ID is being morphed then it will be in the final
          // DOM so clear it out of the saved elements collection
          delete fromNodesLookup[toElKey];
        }

        if (!childrenOnly) {
          // optional
          if (onBeforeElUpdated(fromEl, toEl) === false) {
            return;
          }

          // update attributes on original DOM element first
          morphAttrs(fromEl, toEl);
          // optional
          onElUpdated(fromEl);

          if (onBeforeElChildrenUpdated(fromEl, toEl) === false) {
            return;
          }
        }

        if (fromEl.nodeName !== 'TEXTAREA') {
          morphChildren(fromEl, toEl);
        } else {
          specialElHandlers.TEXTAREA(fromEl, toEl);
        }
      }

      function morphChildren(fromEl, toEl) {
        var skipFrom = skipFromChildren(fromEl);
        var curToNodeChild = toEl.firstChild;
        var curFromNodeChild = fromEl.firstChild;
        var curToNodeKey;
        var curFromNodeKey;

        var fromNextSibling;
        var toNextSibling;
        var matchingFromEl;

        // walk the children
        outer: while (curToNodeChild) {
          toNextSibling = curToNodeChild.nextSibling;
          curToNodeKey = getNodeKey(curToNodeChild);

          // walk the fromNode children all the way through
          while (!skipFrom && curFromNodeChild) {
            fromNextSibling = curFromNodeChild.nextSibling;

            if (curToNodeChild.isSameNode && curToNodeChild.isSameNode(curFromNodeChild)) {
              curToNodeChild = toNextSibling;
              curFromNodeChild = fromNextSibling;
              continue outer;
            }

            curFromNodeKey = getNodeKey(curFromNodeChild);

            var curFromNodeType = curFromNodeChild.nodeType;

            // this means if the curFromNodeChild doesnt have a match with the curToNodeChild
            var isCompatible = undefined;

            if (curFromNodeType === curToNodeChild.nodeType) {
              if (curFromNodeType === ELEMENT_NODE) {
                // Both nodes being compared are Element nodes

                if (curToNodeKey) {
                  // The target node has a key so we want to match it up with the correct element
                  // in the original DOM tree
                  if (curToNodeKey !== curFromNodeKey) {
                    // The current element in the original DOM tree does not have a matching key so
                    // let's check our lookup to see if there is a matching element in the original
                    // DOM tree
                    if ((matchingFromEl = fromNodesLookup[curToNodeKey])) {
                      if (fromNextSibling === matchingFromEl) {
                        // Special case for single element removals. To avoid removing the original
                        // DOM node out of the tree (since that can break CSS transitions, etc.),
                        // we will instead discard the current node and wait until the next
                        // iteration to properly match up the keyed target element with its matching
                        // element in the original tree
                        isCompatible = false;
                      } else {
                        // We found a matching keyed element somewhere in the original DOM tree.
                        // Let's move the original DOM node into the current position and morph
                        // it.

                        // NOTE: We use insertBefore instead of replaceChild because we want to go through
                        // the `removeNode()` function for the node that is being discarded so that
                        // all lifecycle hooks are correctly invoked
                        fromEl.insertBefore(matchingFromEl, curFromNodeChild);

                        // fromNextSibling = curFromNodeChild.nextSibling;

                        if (curFromNodeKey) {
                          // Since the node is keyed it might be matched up later so we defer
                          // the actual removal to later
                          addKeyedRemoval(curFromNodeKey);
                        } else {
                          // NOTE: we skip nested keyed nodes from being removed since there is
                          //       still a chance they will be matched up later
                          removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
                        }

                        curFromNodeChild = matchingFromEl;
                      }
                    } else {
                      // The nodes are not compatible since the "to" node has a key and there
                      // is no matching keyed node in the source tree
                      isCompatible = false;
                    }
                  }
                } else if (curFromNodeKey) {
                  // The original has a key
                  isCompatible = false;
                }

                isCompatible = isCompatible !== false && compareNodeNames(curFromNodeChild, curToNodeChild);
                if (isCompatible) {
                  // We found compatible DOM elements so transform
                  // the current "from" node to match the current
                  // target DOM node.
                  // MORPH
                  morphEl(curFromNodeChild, curToNodeChild);
                }

              } else if (curFromNodeType === TEXT_NODE || curFromNodeType == COMMENT_NODE) {
                // Both nodes being compared are Text or Comment nodes
                isCompatible = true;
                // Simply update nodeValue on the original node to
                // change the text value
                if (curFromNodeChild.nodeValue !== curToNodeChild.nodeValue) {
                  curFromNodeChild.nodeValue = curToNodeChild.nodeValue;
                }

              }
            }

            if (isCompatible) {
              // Advance both the "to" child and the "from" child since we found a match
              // Nothing else to do as we already recursively called morphChildren above
              curToNodeChild = toNextSibling;
              curFromNodeChild = fromNextSibling;
              continue outer;
            }

            // No compatible match so remove the old node from the DOM and continue trying to find a
            // match in the original DOM. However, we only do this if the from node is not keyed
            // since it is possible that a keyed node might match up with a node somewhere else in the
            // target tree and we don't want to discard it just yet since it still might find a
            // home in the final DOM tree. After everything is done we will remove any keyed nodes
            // that didn't find a home
            if (curFromNodeKey) {
              // Since the node is keyed it might be matched up later so we defer
              // the actual removal to later
              addKeyedRemoval(curFromNodeKey);
            } else {
              // NOTE: we skip nested keyed nodes from being removed since there is
              //       still a chance they will be matched up later
              removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
            }

            curFromNodeChild = fromNextSibling;
          } // END: while(curFromNodeChild) {}

          // If we got this far then we did not find a candidate match for
          // our "to node" and we exhausted all of the children "from"
          // nodes. Therefore, we will just append the current "to" node
          // to the end
          if (curToNodeKey && (matchingFromEl = fromNodesLookup[curToNodeKey]) && compareNodeNames(matchingFromEl, curToNodeChild)) {
            // MORPH
            if(!skipFrom){ addChild(fromEl, matchingFromEl); }
            morphEl(matchingFromEl, curToNodeChild);
          } else {
            var onBeforeNodeAddedResult = onBeforeNodeAdded(curToNodeChild);
            if (onBeforeNodeAddedResult !== false) {
              if (onBeforeNodeAddedResult) {
                curToNodeChild = onBeforeNodeAddedResult;
              }

              if (curToNodeChild.actualize) {
                curToNodeChild = curToNodeChild.actualize(fromEl.ownerDocument || doc);
              }
              addChild(fromEl, curToNodeChild);
              handleNodeAdded(curToNodeChild);
            }
          }

          curToNodeChild = toNextSibling;
          curFromNodeChild = fromNextSibling;
        }

        cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey);

        var specialElHandler = specialElHandlers[fromEl.nodeName];
        if (specialElHandler) {
          specialElHandler(fromEl, toEl);
        }
      } // END: morphChildren(...)

      var morphedNode = fromNode;
      var morphedNodeType = morphedNode.nodeType;
      var toNodeType = toNode.nodeType;

      if (!childrenOnly) {
        // Handle the case where we are given two DOM nodes that are not
        // compatible (e.g. <div> --> <span> or <div> --> TEXT)
        if (morphedNodeType === ELEMENT_NODE) {
          if (toNodeType === ELEMENT_NODE) {
            if (!compareNodeNames(fromNode, toNode)) {
              onNodeDiscarded(fromNode);
              morphedNode = moveChildren(fromNode, createElementNS(toNode.nodeName, toNode.namespaceURI));
            }
          } else {
            // Going from an element node to a text node
            morphedNode = toNode;
          }
        } else if (morphedNodeType === TEXT_NODE || morphedNodeType === COMMENT_NODE) { // Text or comment node
          if (toNodeType === morphedNodeType) {
            if (morphedNode.nodeValue !== toNode.nodeValue) {
              morphedNode.nodeValue = toNode.nodeValue;
            }

            return morphedNode;
          } else {
            // Text node to something else
            morphedNode = toNode;
          }
        }
      }

      if (morphedNode === toNode) {
        // The "to node" was not compatible with the "from node" so we had to
        // toss out the "from node" and use the "to node"
        onNodeDiscarded(fromNode);
      } else {
        if (toNode.isSameNode && toNode.isSameNode(morphedNode)) {
          return;
        }

        morphEl(morphedNode, toNode, childrenOnly);

        // We now need to loop over any keyed nodes that might need to be
        // removed. We only do the removal if we know that the keyed node
        // never found a match. When a keyed node is matched up we remove
        // it out of fromNodesLookup and we use fromNodesLookup to determine
        // if a keyed node has been matched up or not
        if (keyedRemovalList) {
          for (var i=0, len=keyedRemovalList.length; i<len; i++) {
            var elToRemove = fromNodesLookup[keyedRemovalList[i]];
            if (elToRemove) {
              removeNode(elToRemove, elToRemove.parentNode, false);
            }
          }
        }
      }

      if (!childrenOnly && morphedNode !== fromNode && fromNode.parentNode) {
        if (morphedNode.actualize) {
          morphedNode = morphedNode.actualize(fromNode.ownerDocument || doc);
        }
        // If we had to swap out the from node with a new node because the old
        // node was not compatible with the target node then we need to
        // replace the old DOM node in the original DOM tree. This is only
        // possible if the original DOM node was part of a DOM tree which
        // we know is the case if it has a parent node.
        fromNode.parentNode.replaceChild(morphedNode, fromNode);
      }

      return morphedNode;
    };
  }

  var morphdom = morphdomFactory(morphAttrs);

  function ClientSideRouting(Alpine) {
      function findAnchorTag(element) {
        if (element.tagName === "HTML") return null;
        if (element.tagName === "A") return element;
        else return findAnchorTag(element.parentElement);
      }
    
      async function updateRoute(pathname) {
        try {
          const html = await fetch(pathname).then((res) => res.text());
    
          // resolve promise after morphdom completed
          morphdom(document.getElementsByTagName("html")[0], html, {
            onBeforeElUpdated(fromEl, toEl) {
                if (fromEl.isEqualNode(toEl)) {
                  return false
              }
              // Do not update icon if name is same
              if(fromEl.hasAttribute('u-icon') && fromEl.getAttribute('name') === toEl.getAttribute('name')) {
                return false
              }
              if (fromEl.nodeName === "SCRIPT" && toEl.nodeName === "SCRIPT" && fromEl.getAttribute('type') === 'module') {
                var script = document.createElement('script');
                //copy over the attributes
                [...toEl.attributes].forEach( attr => { script.setAttribute(attr.nodeName ,attr.nodeValue); });

                script.innerHTML = toEl.innerHTML;
                fromEl.replaceWith(script);
                return false;
            } 
            return true;
            },
            onNodeAdded: function (node) {
              if (node.nodeName === 'SCRIPT') {
                  var script = document.createElement('script');
                  //copy over the attributes
                  [...node.attributes].forEach( attr => { script.setAttribute(attr.nodeName ,attr.nodeValue); });

                  script.innerHTML = node.innerHTML;
                  node.replaceWith(script);
              }
            }
          });

          return true
        } catch (err) {
          console.log(err);
          console.log('path not found');
          location.reload();
          //
        }
      }
    
        window.addEventListener("click", async (event) => {
          
          const link = findAnchorTag(event.target);
    
          if (!link) return;
          if (link.target) return;
          if (link.hasAttribute("u-routing-skip")) return;
          event.preventDefault();
    
          const targetLocation = link.href;
          const targetPathname = new URL(targetLocation).pathname;
    
          history.pushState({}, undefined, targetPathname);
          await updateRoute(targetPathname);
    
        });
    
        window.addEventListener("popstate", async function () {
          await updateRoute(window.location.pathname);
        });
    
    
      Alpine.magic("routing", (el) => {
        return {
          back() {
            history.back();
          },
          goto(pathname) {
            history.pushState({}, undefined, pathname);
            return updateRoute(pathname)
          },
        };
      });
    }

  // tooltip
  // popover
  // dropdown
  // sidebar/navbar items
  // import tippy from "tippy.js/dist/tippy.esm"

  function Popup(Alpine) {

      // use @floating-ui/dom similar to yesvelte
      Alpine.directive('popup', (el, {}, {evaluate, cleanup}) => {
          el.getAttribute('trigger');
          el.getAttribute('placement');
          el.getAttribute('target');

          // let targetEl;

          // if(target) {
          //     targetEl = evaluate(target) ?? el.previousElementSibling
          // } else {
          //     targetEl = el.previousElementSibling;
          // }

          // let instance = tippy(targetEl, {
          //     // hideOnClick: true,
          //     arrow: true,
          //     // placement: placement,
          //     // trigger: trigger,
          //     content: (reference) => reference.innerHTML
          // })[0]

          // cleanup(() => {
          //     instance.destroy()
          // })        
      });
  }

  function Checkbox(Alpine) {
     
      Alpine.directive("checkbox-input", (el) => {
    
        Alpine.bind(el, {
          "u-init"() {
            this.$data.name = el.getAttribute("name");
          },
          "u-on:change"(e) {
            this.$data[el.getAttribute("name")] = e.target.checked;
          },
        });
      });
    
      Alpine.directive("checkbox-group", (el) => {
        const name = el.getAttribute("name");
        let value = [];
    
        el._model = {
          get() {
            return value;
          },
        };
    
        el.querySelectorAll("[u-checkbox-group-item-input]").forEach((item) => {
          if (item.checked) {
            value = [...value, item.value];
          }
    
          Alpine.bind(item, {
            "u-on:change"(event) {
              value = Array.from(this.$data[name]);
    
              // toggle item
              if (value.includes(event.target.value)) {
                value = value.filter((x) => x !== event.target.value);
              } else {
                value = [...value, event.target.value];
              }
    
              this.$data[name] = value;
            },
          });
        });
    
        Alpine.bind(el, {
          "u-init"() {
            this.$data[name] = value;
          },
        });
      });
    }

  function Radio(Alpine) {
      Alpine.directive("radio", (el) => {
        if (el.parentNode.hasAttribute("u-radio-group")) return;
    
        const data = Alpine.$data(el, {
          value: false,
          name: "",
        });
    
        Alpine.bind(el, {
          data,
        });
      });
    

      Alpine.directive("radio-group", (el) => {
        const name = el.getAttribute("name");
        let value = [];
    
        el._model = {
          get() {
            return value;
          },
        };
    
        el.querySelectorAll("[u-radio-group-item-input]").forEach((item) => {
          if (item.checked) {
            value = [...value, item.value];
          }
    
          Alpine.bind(item, {
            "u-on:change"(event) {
              this.$data[name] = event.target.value;
            },
          });
        });
    
        Alpine.bind(el, {
          "u-init"() {
            this.$data[name] = value;
          },
        });
      });
    }

  function Input(Alpine) {
    
      Alpine.directive("input", (el) => {
        Alpine.bind(el, {
          // initial value
          'u-init'() {
            this.$data[el.getAttribute('name')] = el.value;
          },
          "u-on:input"(e) {
            this.$data[el.getAttribute("name")] = e.target.value;
          },
        });
        // input
      });
    }

  function Select(Alpine) {
    Alpine.directive("select", (el) => {
      const multiple = el.getAttribute("multiple");
      const name = el.getAttribute("name");

      // on change
      Alpine.bind(el, {
        "u-on:change"(e) {
          if (multiple) {
            const selectedValues = Array.from(e.target.selectedOptions).map(
              (x) => x.value
            );
            this.$data[name] = selectedValues;
          } else {
            const value = el.selectedOptions[0].value;
            this.$data[name] = value;
          }
        },
      });
    });
  }

  function Textarea(Alpine) {
      Alpine.directive('textarea', (el) => {

          Alpine.bind(el, {
              'u-on:input'(e) {
                  this.$data[el.getAttribute('name')] = e.target.value;
              }
          });
      });
  }

  function attr($el, key, value) {
    if (typeof value === "undefined") {
      const result = $el.getAttribute(key);

      if (result === "false") return false;
      if (result === "true") return true;

      return $el.getAttribute(key);
    }

    if (value == "") {
      $el.removeAttribute(key);
    } else if (value === true) {
      $el.setAttribute(key, "");
    } else {
      $el.setAttribute(key, value);
    }
  }
  function getAttr($el, key) {
    const value = attr($el, key);

    if (value === "") return true;
    if (!value) return false;

    return value;
  }

  function removeAttr($el, key) {
    attr($el, key, "");
  }
  function setAttr($el, key, value = true) {
    attr($el, key, value);
  }

  function query($el, key, callback) {
    return $el.querySelectorAll(key).forEach((el) => callback(el));
  }
  function queryAttr($el, key, callback) {
    return query($el, `[${key}]`, callback);
  }

  function Tabs(Alpine) {
      Alpine.directive('tabs', (el, first, second)=>{
          let tabItems = [];
          let tabPanels = [];
          let activeTab  = 0;

          el.querySelectorAll('[u-tabs-item]').forEach((item) => {

              tabItems.push(item);
              let index = tabItems.indexOf(item);
              if(getAttr(item, 'u-tabs-item-active')){
                  activeTab = index;
              }
              item.onclick = (event)=>{
                  queryAttr(el, 'u-tabs-item-active', (e)=>{
                      removeAttr(e, 'u-tabs-item-active');
                  });
                  queryAttr(el, 'u-tabs-panel-active', (e)=>{
                      removeAttr(e, 'u-tabs-panel-active');
                  });
                  setAttr(item, 'u-tabs-item-active', true);
                  setAttr(tabPanels[index], 'u-tabs-panel-active', true);
              };
          },);

          el.querySelectorAll('[u-tabs-panel]').forEach(panel => {
              tabPanels.push(panel);
          });

          
          setAttr(tabPanels[activeTab], 'u-tabs-panel-active', true);
          setAttr(tabItems[activeTab], 'u-tabs-item-active', true);
      



      });
  }

  function Dropdown(Alpine){
    Alpine.directive('dropdown', (el, {}, {Alpine})=>{
      console.log('dropdown registerd');
      Alpine.bind(el, ()=>({
        "u-data"(){
          return {
            open: false, 
            timeout: undefined, 
            toggle(){
              if(this.open){ 
                  return this.close()
              } else { 
                  return this.show()
              }
            },
            show(){
              this.open = true; 
              console.log('open', this.open);
            },
            close(){
              this.open = false; 
              console.log('close', this.open);
            },
          }  
        },
        "u-id": "['dropdown']",
      }));
    });
    Alpine.directive('dropdown-click', (el, {}, {Alpine})=>{
      console.log('dropdown registerd');
      Alpine.bind(el, ()=>({
        "u-on:click"(){
          this.toggle();
        },
        "u-on:click.outside"(){
          this.close();
        }
      }));
    });
    Alpine.directive('dropdown-hover', (el, {}, {Alpine})=>{
      console.log('dropdown hover registered');
      Alpine.bind(el, ()=>({
        "u-on:mouseenter"(){
          clearTimeout(this.timeout);
          this.show();
        },
        "u-on:mouseleave"() {
          this.timeout = setTimeout(()=>{
            this.close();
          },200);
        },
      }));
    });

    
    // Alpine.directive('dropdown-item', (el, {}, {evaluate})=>{
    //   Alpine.bind(el, () => ({
        
    //   }));
    // })

    Alpine.directive('dropdown-panel', (el, {}, {evaluate})=>{
      Alpine.bind(el, () => ({
        "u-show": "open",
        // "u-on:click.outside"(){
        //   this.close()
        // } ,
        // "u-on:mouseenter"() {
        //   clearTimeout(this.timeout)
        // },
        // "u-on:mouseleave"(){
        //   this.timeout = setTimeout(()=>{close()}, 200)
        // },
      }));
    });
  }

  function getAlignment(placement) {
    return placement.split('-')[1];
  }

  function getLengthFromAxis(axis) {
    return axis === 'y' ? 'height' : 'width';
  }

  function getSide(placement) {
    return placement.split('-')[0];
  }

  function getMainAxisFromPlacement(placement) {
    return ['top', 'bottom'].includes(getSide(placement)) ? 'x' : 'y';
  }

  function computeCoordsFromPlacement(_ref, placement, rtl) {
    let {
      reference,
      floating
    } = _ref;
    const commonX = reference.x + reference.width / 2 - floating.width / 2;
    const commonY = reference.y + reference.height / 2 - floating.height / 2;
    const mainAxis = getMainAxisFromPlacement(placement);
    const length = getLengthFromAxis(mainAxis);
    const commonAlign = reference[length] / 2 - floating[length] / 2;
    const side = getSide(placement);
    const isVertical = mainAxis === 'x';
    let coords;
    switch (side) {
      case 'top':
        coords = {
          x: commonX,
          y: reference.y - floating.height
        };
        break;
      case 'bottom':
        coords = {
          x: commonX,
          y: reference.y + reference.height
        };
        break;
      case 'right':
        coords = {
          x: reference.x + reference.width,
          y: commonY
        };
        break;
      case 'left':
        coords = {
          x: reference.x - floating.width,
          y: commonY
        };
        break;
      default:
        coords = {
          x: reference.x,
          y: reference.y
        };
    }
    switch (getAlignment(placement)) {
      case 'start':
        coords[mainAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
        break;
      case 'end':
        coords[mainAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
        break;
    }
    return coords;
  }

  /**
   * Computes the `x` and `y` coordinates that will place the floating element
   * next to a reference element when it is given a certain positioning strategy.
   *
   * This export does not have any `platform` interface logic. You will need to
   * write one for the platform you are using Floating UI with.
   */
  const computePosition$1 = async (reference, floating, config) => {
    const {
      placement = 'bottom',
      strategy = 'absolute',
      middleware = [],
      platform
    } = config;
    const validMiddleware = middleware.filter(Boolean);
    const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(floating));
    let rects = await platform.getElementRects({
      reference,
      floating,
      strategy
    });
    let {
      x,
      y
    } = computeCoordsFromPlacement(rects, placement, rtl);
    let statefulPlacement = placement;
    let middlewareData = {};
    let resetCount = 0;
    for (let i = 0; i < validMiddleware.length; i++) {
      const {
        name,
        fn
      } = validMiddleware[i];
      const {
        x: nextX,
        y: nextY,
        data,
        reset
      } = await fn({
        x,
        y,
        initialPlacement: placement,
        placement: statefulPlacement,
        strategy,
        middlewareData,
        rects,
        platform,
        elements: {
          reference,
          floating
        }
      });
      x = nextX != null ? nextX : x;
      y = nextY != null ? nextY : y;
      middlewareData = {
        ...middlewareData,
        [name]: {
          ...middlewareData[name],
          ...data
        }
      };
      if (reset && resetCount <= 50) {
        resetCount++;
        if (typeof reset === 'object') {
          if (reset.placement) {
            statefulPlacement = reset.placement;
          }
          if (reset.rects) {
            rects = reset.rects === true ? await platform.getElementRects({
              reference,
              floating,
              strategy
            }) : reset.rects;
          }
          ({
            x,
            y
          } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
        }
        i = -1;
        continue;
      }
    }
    return {
      x,
      y,
      placement: statefulPlacement,
      strategy,
      middlewareData
    };
  };

  function evaluate(value, param) {
    return typeof value === 'function' ? value(param) : value;
  }

  function expandPaddingObject(padding) {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      ...padding
    };
  }

  function getSideObjectFromPadding(padding) {
    return typeof padding !== 'number' ? expandPaddingObject(padding) : {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding
    };
  }

  function rectToClientRect(rect) {
    return {
      ...rect,
      top: rect.y,
      left: rect.x,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height
    };
  }

  /**
   * Resolves with an object of overflow side offsets that determine how much the
   * element is overflowing a given clipping boundary on each side.
   * - positive = overflowing the boundary by that number of pixels
   * - negative = how many pixels left before it will overflow
   * - 0 = lies flush with the boundary
   * @see https://floating-ui.com/docs/detectOverflow
   */
  async function detectOverflow(state, options) {
    var _await$platform$isEle;
    if (options === void 0) {
      options = {};
    }
    const {
      x,
      y,
      platform,
      rects,
      elements,
      strategy
    } = state;
    const {
      boundary = 'clippingAncestors',
      rootBoundary = 'viewport',
      elementContext = 'floating',
      altBoundary = false,
      padding = 0
    } = evaluate(options, state);
    const paddingObject = getSideObjectFromPadding(padding);
    const altContext = elementContext === 'floating' ? 'reference' : 'floating';
    const element = elements[altBoundary ? altContext : elementContext];
    const clippingClientRect = rectToClientRect(await platform.getClippingRect({
      element: ((_await$platform$isEle = await (platform.isElement == null ? void 0 : platform.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || (await (platform.getDocumentElement == null ? void 0 : platform.getDocumentElement(elements.floating))),
      boundary,
      rootBoundary,
      strategy
    }));
    const rect = elementContext === 'floating' ? {
      ...rects.floating,
      x,
      y
    } : rects.reference;
    const offsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(elements.floating));
    const offsetScale = (await (platform.isElement == null ? void 0 : platform.isElement(offsetParent))) ? (await (platform.getScale == null ? void 0 : platform.getScale(offsetParent))) || {
      x: 1,
      y: 1
    } : {
      x: 1,
      y: 1
    };
    const elementClientRect = rectToClientRect(platform.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
      rect,
      offsetParent,
      strategy
    }) : rect);
    return {
      top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
      bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
      left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
      right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
    };
  }

  const min$1 = Math.min;
  const max$1 = Math.max;

  function within(min$1$1, value, max$1$1) {
    return max$1(min$1$1, min$1(value, max$1$1));
  }

  /**
   * Provides data to position an inner element of the floating element so that it
   * appears centered to the reference element.
   * @see https://floating-ui.com/docs/arrow
   */
  const arrow = options => ({
    name: 'arrow',
    options,
    async fn(state) {
      const {
        x,
        y,
        placement,
        rects,
        platform,
        elements
      } = state;
      // Since `element` is required, we don't Partial<> the type.
      const {
        element,
        padding = 0
      } = evaluate(options, state) || {};
      if (element == null) {
        return {};
      }
      const paddingObject = getSideObjectFromPadding(padding);
      const coords = {
        x,
        y
      };
      const axis = getMainAxisFromPlacement(placement);
      const length = getLengthFromAxis(axis);
      const arrowDimensions = await platform.getDimensions(element);
      const isYAxis = axis === 'y';
      const minProp = isYAxis ? 'top' : 'left';
      const maxProp = isYAxis ? 'bottom' : 'right';
      const clientProp = isYAxis ? 'clientHeight' : 'clientWidth';
      const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
      const startDiff = coords[axis] - rects.reference[axis];
      const arrowOffsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(element));
      let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;

      // DOM platform can return `window` as the `offsetParent`.
      if (!clientSize || !(await (platform.isElement == null ? void 0 : platform.isElement(arrowOffsetParent)))) {
        clientSize = elements.floating[clientProp] || rects.floating[length];
      }
      const centerToReference = endDiff / 2 - startDiff / 2;

      // If the padding is large enough that it causes the arrow to no longer be
      // centered, modify the padding so that it is centered.
      const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
      const minPadding = min$1(paddingObject[minProp], largestPossiblePadding);
      const maxPadding = min$1(paddingObject[maxProp], largestPossiblePadding);

      // Make sure the arrow doesn't overflow the floating element if the center
      // point is outside the floating element's bounds.
      const min$1$1 = minPadding;
      const max = clientSize - arrowDimensions[length] - maxPadding;
      const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
      const offset = within(min$1$1, center, max);

      // If the reference is small enough that the arrow's padding causes it to
      // to point to nothing for an aligned placement, adjust the offset of the
      // floating element itself. This stops `shift()` from taking action, but can
      // be worked around by calling it again after the `arrow()` if desired.
      const shouldAddOffset = getAlignment(placement) != null && center != offset && rects.reference[length] / 2 - (center < min$1$1 ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
      const alignmentOffset = shouldAddOffset ? center < min$1$1 ? min$1$1 - center : max - center : 0;
      return {
        [axis]: coords[axis] - alignmentOffset,
        data: {
          [axis]: offset,
          centerOffset: center - offset + alignmentOffset
        }
      };
    }
  });

  const oppositeSideMap = {
    left: 'right',
    right: 'left',
    bottom: 'top',
    top: 'bottom'
  };
  function getOppositePlacement(placement) {
    return placement.replace(/left|right|bottom|top/g, side => oppositeSideMap[side]);
  }

  function getAlignmentSides(placement, rects, rtl) {
    if (rtl === void 0) {
      rtl = false;
    }
    const alignment = getAlignment(placement);
    const mainAxis = getMainAxisFromPlacement(placement);
    const length = getLengthFromAxis(mainAxis);
    let mainAlignmentSide = mainAxis === 'x' ? alignment === (rtl ? 'end' : 'start') ? 'right' : 'left' : alignment === 'start' ? 'bottom' : 'top';
    if (rects.reference[length] > rects.floating[length]) {
      mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
    }
    return {
      main: mainAlignmentSide,
      cross: getOppositePlacement(mainAlignmentSide)
    };
  }

  const oppositeAlignmentMap = {
    start: 'end',
    end: 'start'
  };
  function getOppositeAlignmentPlacement(placement) {
    return placement.replace(/start|end/g, alignment => oppositeAlignmentMap[alignment]);
  }

  function getExpandedPlacements(placement) {
    const oppositePlacement = getOppositePlacement(placement);
    return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
  }

  function getSideList(side, isStart, rtl) {
    const lr = ['left', 'right'];
    const rl = ['right', 'left'];
    const tb = ['top', 'bottom'];
    const bt = ['bottom', 'top'];
    switch (side) {
      case 'top':
      case 'bottom':
        if (rtl) return isStart ? rl : lr;
        return isStart ? lr : rl;
      case 'left':
      case 'right':
        return isStart ? tb : bt;
      default:
        return [];
    }
  }
  function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
    const alignment = getAlignment(placement);
    let list = getSideList(getSide(placement), direction === 'start', rtl);
    if (alignment) {
      list = list.map(side => side + "-" + alignment);
      if (flipAlignment) {
        list = list.concat(list.map(getOppositeAlignmentPlacement));
      }
    }
    return list;
  }

  /**
   * Optimizes the visibility of the floating element by flipping the `placement`
   * in order to keep it in view when the preferred placement(s) will overflow the
   * clipping boundary. Alternative to `autoPlacement`.
   * @see https://floating-ui.com/docs/flip
   */
  const flip = function (options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: 'flip',
      options,
      async fn(state) {
        var _middlewareData$flip;
        const {
          placement,
          middlewareData,
          rects,
          initialPlacement,
          platform,
          elements
        } = state;
        const {
          mainAxis: checkMainAxis = true,
          crossAxis: checkCrossAxis = true,
          fallbackPlacements: specifiedFallbackPlacements,
          fallbackStrategy = 'bestFit',
          fallbackAxisSideDirection = 'none',
          flipAlignment = true,
          ...detectOverflowOptions
        } = evaluate(options, state);
        const side = getSide(placement);
        const isBasePlacement = getSide(initialPlacement) === initialPlacement;
        const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
        const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
        if (!specifiedFallbackPlacements && fallbackAxisSideDirection !== 'none') {
          fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
        }
        const placements = [initialPlacement, ...fallbackPlacements];
        const overflow = await detectOverflow(state, detectOverflowOptions);
        const overflows = [];
        let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
        if (checkMainAxis) {
          overflows.push(overflow[side]);
        }
        if (checkCrossAxis) {
          const {
            main,
            cross
          } = getAlignmentSides(placement, rects, rtl);
          overflows.push(overflow[main], overflow[cross]);
        }
        overflowsData = [...overflowsData, {
          placement,
          overflows
        }];

        // One or more sides is overflowing.
        if (!overflows.every(side => side <= 0)) {
          var _middlewareData$flip2, _overflowsData$filter;
          const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
          const nextPlacement = placements[nextIndex];
          if (nextPlacement) {
            // Try next placement and re-run the lifecycle.
            return {
              data: {
                index: nextIndex,
                overflows: overflowsData
              },
              reset: {
                placement: nextPlacement
              }
            };
          }

          // First, find the candidates that fit on the mainAxis side of overflow,
          // then find the placement that fits the best on the main crossAxis side.
          let resetPlacement = (_overflowsData$filter = overflowsData.filter(d => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;

          // Otherwise fallback.
          if (!resetPlacement) {
            switch (fallbackStrategy) {
              case 'bestFit':
                {
                  var _overflowsData$map$so;
                  const placement = (_overflowsData$map$so = overflowsData.map(d => [d.placement, d.overflows.filter(overflow => overflow > 0).reduce((acc, overflow) => acc + overflow, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$map$so[0];
                  if (placement) {
                    resetPlacement = placement;
                  }
                  break;
                }
              case 'initialPlacement':
                resetPlacement = initialPlacement;
                break;
            }
          }
          if (placement !== resetPlacement) {
            return {
              reset: {
                placement: resetPlacement
              }
            };
          }
        }
        return {};
      }
    };
  };

  async function convertValueToCoords(state, options) {
    const {
      placement,
      platform,
      elements
    } = state;
    const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
    const side = getSide(placement);
    const alignment = getAlignment(placement);
    const isVertical = getMainAxisFromPlacement(placement) === 'x';
    const mainAxisMulti = ['left', 'top'].includes(side) ? -1 : 1;
    const crossAxisMulti = rtl && isVertical ? -1 : 1;
    const rawValue = evaluate(options, state);

    // eslint-disable-next-line prefer-const
    let {
      mainAxis,
      crossAxis,
      alignmentAxis
    } = typeof rawValue === 'number' ? {
      mainAxis: rawValue,
      crossAxis: 0,
      alignmentAxis: null
    } : {
      mainAxis: 0,
      crossAxis: 0,
      alignmentAxis: null,
      ...rawValue
    };
    if (alignment && typeof alignmentAxis === 'number') {
      crossAxis = alignment === 'end' ? alignmentAxis * -1 : alignmentAxis;
    }
    return isVertical ? {
      x: crossAxis * crossAxisMulti,
      y: mainAxis * mainAxisMulti
    } : {
      x: mainAxis * mainAxisMulti,
      y: crossAxis * crossAxisMulti
    };
  }

  /**
   * Modifies the placement by translating the floating element along the
   * specified axes.
   * A number (shorthand for `mainAxis` or distance), or an axes configuration
   * object may be passed.
   * @see https://floating-ui.com/docs/offset
   */
  const offset = function (options) {
    if (options === void 0) {
      options = 0;
    }
    return {
      name: 'offset',
      options,
      async fn(state) {
        const {
          x,
          y
        } = state;
        const diffCoords = await convertValueToCoords(state, options);
        return {
          x: x + diffCoords.x,
          y: y + diffCoords.y,
          data: diffCoords
        };
      }
    };
  };

  function getCrossAxis(axis) {
    return axis === 'x' ? 'y' : 'x';
  }

  /**
   * Optimizes the visibility of the floating element by shifting it in order to
   * keep it in view when it will overflow the clipping boundary.
   * @see https://floating-ui.com/docs/shift
   */
  const shift = function (options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: 'shift',
      options,
      async fn(state) {
        const {
          x,
          y,
          placement
        } = state;
        const {
          mainAxis: checkMainAxis = true,
          crossAxis: checkCrossAxis = false,
          limiter = {
            fn: _ref => {
              let {
                x,
                y
              } = _ref;
              return {
                x,
                y
              };
            }
          },
          ...detectOverflowOptions
        } = evaluate(options, state);
        const coords = {
          x,
          y
        };
        const overflow = await detectOverflow(state, detectOverflowOptions);
        const mainAxis = getMainAxisFromPlacement(getSide(placement));
        const crossAxis = getCrossAxis(mainAxis);
        let mainAxisCoord = coords[mainAxis];
        let crossAxisCoord = coords[crossAxis];
        if (checkMainAxis) {
          const minSide = mainAxis === 'y' ? 'top' : 'left';
          const maxSide = mainAxis === 'y' ? 'bottom' : 'right';
          const min = mainAxisCoord + overflow[minSide];
          const max = mainAxisCoord - overflow[maxSide];
          mainAxisCoord = within(min, mainAxisCoord, max);
        }
        if (checkCrossAxis) {
          const minSide = crossAxis === 'y' ? 'top' : 'left';
          const maxSide = crossAxis === 'y' ? 'bottom' : 'right';
          const min = crossAxisCoord + overflow[minSide];
          const max = crossAxisCoord - overflow[maxSide];
          crossAxisCoord = within(min, crossAxisCoord, max);
        }
        const limitedCoords = limiter.fn({
          ...state,
          [mainAxis]: mainAxisCoord,
          [crossAxis]: crossAxisCoord
        });
        return {
          ...limitedCoords,
          data: {
            x: limitedCoords.x - x,
            y: limitedCoords.y - y
          }
        };
      }
    };
  };

  function getWindow(node) {
    var _node$ownerDocument;
    return (node == null ? void 0 : (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
  }

  function getComputedStyle$1(element) {
    return getWindow(element).getComputedStyle(element);
  }

  function isNode(value) {
    return value instanceof getWindow(value).Node;
  }
  function getNodeName(node) {
    if (isNode(node)) {
      return (node.nodeName || '').toLowerCase();
    }
    // Mocked nodes in testing environments may not be instances of Node. By
    // returning `#document` an infinite loop won't occur.
    // https://github.com/floating-ui/floating-ui/issues/2317
    return '#document';
  }

  function isHTMLElement(value) {
    return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
  }
  function isShadowRoot(node) {
    // Browsers without `ShadowRoot` support.
    if (typeof ShadowRoot === 'undefined') {
      return false;
    }
    return node instanceof getWindow(node).ShadowRoot || node instanceof ShadowRoot;
  }
  function isOverflowElement(element) {
    const {
      overflow,
      overflowX,
      overflowY,
      display
    } = getComputedStyle$1(element);
    return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && !['inline', 'contents'].includes(display);
  }
  function isTableElement(element) {
    return ['table', 'td', 'th'].includes(getNodeName(element));
  }
  function isContainingBlock(element) {
    const safari = isSafari();
    const css = getComputedStyle$1(element);

    // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
    return css.transform !== 'none' || css.perspective !== 'none' || (css.containerType ? css.containerType !== 'normal' : false) || !safari && (css.backdropFilter ? css.backdropFilter !== 'none' : false) || !safari && (css.filter ? css.filter !== 'none' : false) || ['transform', 'perspective', 'filter'].some(value => (css.willChange || '').includes(value)) || ['paint', 'layout', 'strict', 'content'].some(value => (css.contain || '').includes(value));
  }
  function isSafari() {
    if (typeof CSS === 'undefined' || !CSS.supports) return false;
    return CSS.supports('-webkit-backdrop-filter', 'none');
  }
  function isLastTraversableNode(node) {
    return ['html', 'body', '#document'].includes(getNodeName(node));
  }

  const min = Math.min;
  const max = Math.max;
  const round = Math.round;
  const floor = Math.floor;
  const createCoords = v => ({
    x: v,
    y: v
  });

  function getCssDimensions(element) {
    const css = getComputedStyle$1(element);
    // In testing environments, the `width` and `height` properties are empty
    // strings for SVG elements, returning NaN. Fallback to `0` in this case.
    let width = parseFloat(css.width) || 0;
    let height = parseFloat(css.height) || 0;
    const hasOffset = isHTMLElement(element);
    const offsetWidth = hasOffset ? element.offsetWidth : width;
    const offsetHeight = hasOffset ? element.offsetHeight : height;
    const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
    if (shouldFallback) {
      width = offsetWidth;
      height = offsetHeight;
    }
    return {
      width,
      height,
      $: shouldFallback
    };
  }

  function isElement(value) {
    return value instanceof Element || value instanceof getWindow(value).Element;
  }

  function unwrapElement(element) {
    return !isElement(element) ? element.contextElement : element;
  }

  function getScale(element) {
    const domElement = unwrapElement(element);
    if (!isHTMLElement(domElement)) {
      return createCoords(1);
    }
    const rect = domElement.getBoundingClientRect();
    const {
      width,
      height,
      $
    } = getCssDimensions(domElement);
    let x = ($ ? round(rect.width) : rect.width) / width;
    let y = ($ ? round(rect.height) : rect.height) / height;

    // 0, NaN, or Infinity should always fallback to 1.

    if (!x || !Number.isFinite(x)) {
      x = 1;
    }
    if (!y || !Number.isFinite(y)) {
      y = 1;
    }
    return {
      x,
      y
    };
  }

  const noOffsets = /*#__PURE__*/createCoords(0);
  function getVisualOffsets(element) {
    const win = getWindow(element);
    if (!isSafari() || !win.visualViewport) {
      return noOffsets;
    }
    return {
      x: win.visualViewport.offsetLeft,
      y: win.visualViewport.offsetTop
    };
  }
  function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
    if (isFixed === void 0) {
      isFixed = false;
    }
    if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element)) {
      return false;
    }
    return isFixed;
  }

  function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
    if (includeScale === void 0) {
      includeScale = false;
    }
    if (isFixedStrategy === void 0) {
      isFixedStrategy = false;
    }
    const clientRect = element.getBoundingClientRect();
    const domElement = unwrapElement(element);
    let scale = createCoords(1);
    if (includeScale) {
      if (offsetParent) {
        if (isElement(offsetParent)) {
          scale = getScale(offsetParent);
        }
      } else {
        scale = getScale(element);
      }
    }
    const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
    let x = (clientRect.left + visualOffsets.x) / scale.x;
    let y = (clientRect.top + visualOffsets.y) / scale.y;
    let width = clientRect.width / scale.x;
    let height = clientRect.height / scale.y;
    if (domElement) {
      const win = getWindow(domElement);
      const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
      let currentIFrame = win.frameElement;
      while (currentIFrame && offsetParent && offsetWin !== win) {
        const iframeScale = getScale(currentIFrame);
        const iframeRect = currentIFrame.getBoundingClientRect();
        const css = getComputedStyle(currentIFrame);
        const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
        const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
        x *= iframeScale.x;
        y *= iframeScale.y;
        width *= iframeScale.x;
        height *= iframeScale.y;
        x += left;
        y += top;
        currentIFrame = getWindow(currentIFrame).frameElement;
      }
    }
    return rectToClientRect({
      width,
      height,
      x,
      y
    });
  }

  function getNodeScroll(element) {
    if (isElement(element)) {
      return {
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop
      };
    }
    return {
      scrollLeft: element.pageXOffset,
      scrollTop: element.pageYOffset
    };
  }

  function getDocumentElement(node) {
    var _ref;
    return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
  }

  function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
    let {
      rect,
      offsetParent,
      strategy
    } = _ref;
    const isOffsetParentAnElement = isHTMLElement(offsetParent);
    const documentElement = getDocumentElement(offsetParent);
    if (offsetParent === documentElement) {
      return rect;
    }
    let scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    let scale = createCoords(1);
    const offsets = createCoords(0);
    if (isOffsetParentAnElement || !isOffsetParentAnElement && strategy !== 'fixed') {
      if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isHTMLElement(offsetParent)) {
        const offsetRect = getBoundingClientRect(offsetParent);
        scale = getScale(offsetParent);
        offsets.x = offsetRect.x + offsetParent.clientLeft;
        offsets.y = offsetRect.y + offsetParent.clientTop;
      }
    }
    return {
      width: rect.width * scale.x,
      height: rect.height * scale.y,
      x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x,
      y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y
    };
  }

  function getClientRects(element) {
    return Array.from(element.getClientRects());
  }

  function getWindowScrollBarX(element) {
    // If <html> has a CSS width greater than the viewport, then this will be
    // incorrect for RTL.
    return getBoundingClientRect(getDocumentElement(element)).left + getNodeScroll(element).scrollLeft;
  }

  // Gets the entire size of the scrollable document area, even extending outside
  // of the `<html>` and `<body>` rect bounds if horizontally scrollable.
  function getDocumentRect(element) {
    const html = getDocumentElement(element);
    const scroll = getNodeScroll(element);
    const body = element.ownerDocument.body;
    const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
    const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
    let x = -scroll.scrollLeft + getWindowScrollBarX(element);
    const y = -scroll.scrollTop;
    if (getComputedStyle$1(body).direction === 'rtl') {
      x += max(html.clientWidth, body.clientWidth) - width;
    }
    return {
      width,
      height,
      x,
      y
    };
  }

  function getParentNode(node) {
    if (getNodeName(node) === 'html') {
      return node;
    }
    const result =
    // Step into the shadow DOM of the parent of a slotted node.
    node.assignedSlot ||
    // DOM Element detected.
    node.parentNode ||
    // ShadowRoot detected.
    isShadowRoot(node) && node.host ||
    // Fallback.
    getDocumentElement(node);
    return isShadowRoot(result) ? result.host : result;
  }

  function getNearestOverflowAncestor(node) {
    const parentNode = getParentNode(node);
    if (isLastTraversableNode(parentNode)) {
      return node.ownerDocument ? node.ownerDocument.body : node.body;
    }
    if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
      return parentNode;
    }
    return getNearestOverflowAncestor(parentNode);
  }

  function getOverflowAncestors(node, list) {
    var _node$ownerDocument;
    if (list === void 0) {
      list = [];
    }
    const scrollableAncestor = getNearestOverflowAncestor(node);
    const isBody = scrollableAncestor === ((_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.body);
    const win = getWindow(scrollableAncestor);
    if (isBody) {
      return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : []);
    }
    return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor));
  }

  function getViewportRect(element, strategy) {
    const win = getWindow(element);
    const html = getDocumentElement(element);
    const visualViewport = win.visualViewport;
    let width = html.clientWidth;
    let height = html.clientHeight;
    let x = 0;
    let y = 0;
    if (visualViewport) {
      width = visualViewport.width;
      height = visualViewport.height;
      const visualViewportBased = isSafari();
      if (!visualViewportBased || visualViewportBased && strategy === 'fixed') {
        x = visualViewport.offsetLeft;
        y = visualViewport.offsetTop;
      }
    }
    return {
      width,
      height,
      x,
      y
    };
  }

  // Returns the inner client rect, subtracting scrollbars if present.
  function getInnerBoundingClientRect(element, strategy) {
    const clientRect = getBoundingClientRect(element, true, strategy === 'fixed');
    const top = clientRect.top + element.clientTop;
    const left = clientRect.left + element.clientLeft;
    const scale = isHTMLElement(element) ? getScale(element) : createCoords(1);
    const width = element.clientWidth * scale.x;
    const height = element.clientHeight * scale.y;
    const x = left * scale.x;
    const y = top * scale.y;
    return {
      width,
      height,
      x,
      y
    };
  }
  function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
    let rect;
    if (clippingAncestor === 'viewport') {
      rect = getViewportRect(element, strategy);
    } else if (clippingAncestor === 'document') {
      rect = getDocumentRect(getDocumentElement(element));
    } else if (isElement(clippingAncestor)) {
      rect = getInnerBoundingClientRect(clippingAncestor, strategy);
    } else {
      const visualOffsets = getVisualOffsets(element);
      rect = {
        ...clippingAncestor,
        x: clippingAncestor.x - visualOffsets.x,
        y: clippingAncestor.y - visualOffsets.y
      };
    }
    return rectToClientRect(rect);
  }
  function hasFixedPositionAncestor(element, stopNode) {
    const parentNode = getParentNode(element);
    if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
      return false;
    }
    return getComputedStyle$1(parentNode).position === 'fixed' || hasFixedPositionAncestor(parentNode, stopNode);
  }

  // A "clipping ancestor" is an `overflow` element with the characteristic of
  // clipping (or hiding) child elements. This returns all clipping ancestors
  // of the given element up the tree.
  function getClippingElementAncestors(element, cache) {
    const cachedResult = cache.get(element);
    if (cachedResult) {
      return cachedResult;
    }
    let result = getOverflowAncestors(element).filter(el => isElement(el) && getNodeName(el) !== 'body');
    let currentContainingBlockComputedStyle = null;
    const elementIsFixed = getComputedStyle$1(element).position === 'fixed';
    let currentNode = elementIsFixed ? getParentNode(element) : element;

    // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
    while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
      const computedStyle = getComputedStyle$1(currentNode);
      const currentNodeIsContaining = isContainingBlock(currentNode);
      if (!currentNodeIsContaining && computedStyle.position === 'fixed') {
        currentContainingBlockComputedStyle = null;
      }
      const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === 'static' && !!currentContainingBlockComputedStyle && ['absolute', 'fixed'].includes(currentContainingBlockComputedStyle.position) || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode);
      if (shouldDropCurrentNode) {
        // Drop non-containing blocks.
        result = result.filter(ancestor => ancestor !== currentNode);
      } else {
        // Record last containing block for next iteration.
        currentContainingBlockComputedStyle = computedStyle;
      }
      currentNode = getParentNode(currentNode);
    }
    cache.set(element, result);
    return result;
  }

  // Gets the maximum area that the element is visible in due to any number of
  // clipping ancestors.
  function getClippingRect(_ref) {
    let {
      element,
      boundary,
      rootBoundary,
      strategy
    } = _ref;
    const elementClippingAncestors = boundary === 'clippingAncestors' ? getClippingElementAncestors(element, this._c) : [].concat(boundary);
    const clippingAncestors = [...elementClippingAncestors, rootBoundary];
    const firstClippingAncestor = clippingAncestors[0];
    const clippingRect = clippingAncestors.reduce((accRect, clippingAncestor) => {
      const rect = getClientRectFromClippingAncestor(element, clippingAncestor, strategy);
      accRect.top = max(rect.top, accRect.top);
      accRect.right = min(rect.right, accRect.right);
      accRect.bottom = min(rect.bottom, accRect.bottom);
      accRect.left = max(rect.left, accRect.left);
      return accRect;
    }, getClientRectFromClippingAncestor(element, firstClippingAncestor, strategy));
    return {
      width: clippingRect.right - clippingRect.left,
      height: clippingRect.bottom - clippingRect.top,
      x: clippingRect.left,
      y: clippingRect.top
    };
  }

  function getDimensions(element) {
    return getCssDimensions(element);
  }

  function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
    const isOffsetParentAnElement = isHTMLElement(offsetParent);
    const documentElement = getDocumentElement(offsetParent);
    const isFixed = strategy === 'fixed';
    const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
    let scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    const offsets = createCoords(0);
    if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
      if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isHTMLElement(offsetParent)) {
        const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
        offsets.x = offsetRect.x + offsetParent.clientLeft;
        offsets.y = offsetRect.y + offsetParent.clientTop;
      } else if (documentElement) {
        offsets.x = getWindowScrollBarX(documentElement);
      }
    }
    return {
      x: rect.left + scroll.scrollLeft - offsets.x,
      y: rect.top + scroll.scrollTop - offsets.y,
      width: rect.width,
      height: rect.height
    };
  }

  function getTrueOffsetParent(element, polyfill) {
    if (!isHTMLElement(element) || getComputedStyle$1(element).position === 'fixed') {
      return null;
    }
    if (polyfill) {
      return polyfill(element);
    }
    return element.offsetParent;
  }
  function getContainingBlock(element) {
    let currentNode = getParentNode(element);
    while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
      if (isContainingBlock(currentNode)) {
        return currentNode;
      } else {
        currentNode = getParentNode(currentNode);
      }
    }
    return null;
  }

  // Gets the closest ancestor positioned element. Handles some edge cases,
  // such as table ancestors and cross browser bugs.
  function getOffsetParent(element, polyfill) {
    const window = getWindow(element);
    if (!isHTMLElement(element)) {
      return window;
    }
    let offsetParent = getTrueOffsetParent(element, polyfill);
    while (offsetParent && isTableElement(offsetParent) && getComputedStyle$1(offsetParent).position === 'static') {
      offsetParent = getTrueOffsetParent(offsetParent, polyfill);
    }
    if (offsetParent && (getNodeName(offsetParent) === 'html' || getNodeName(offsetParent) === 'body' && getComputedStyle$1(offsetParent).position === 'static' && !isContainingBlock(offsetParent))) {
      return window;
    }
    return offsetParent || getContainingBlock(element) || window;
  }

  const getElementRects = async function (_ref) {
    let {
      reference,
      floating,
      strategy
    } = _ref;
    const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
    const getDimensionsFn = this.getDimensions;
    return {
      reference: getRectRelativeToOffsetParent(reference, await getOffsetParentFn(floating), strategy),
      floating: {
        x: 0,
        y: 0,
        ...(await getDimensionsFn(floating))
      }
    };
  };

  function isRTL(element) {
    return getComputedStyle(element).direction === 'rtl';
  }

  const platform = {
    convertOffsetParentRelativeRectToViewportRelativeRect,
    getDocumentElement,
    getClippingRect,
    getOffsetParent,
    getElementRects,
    getClientRects,
    getDimensions,
    getScale,
    isElement,
    isRTL
  };

  // https://samthor.au/2021/observing-dom/
  function observeMove(element, onMove) {
    let io = null;
    let timeoutId;
    const root = getDocumentElement(element);
    function cleanup() {
      clearTimeout(timeoutId);
      io && io.disconnect();
      io = null;
    }
    function refresh(skip, threshold) {
      if (skip === void 0) {
        skip = false;
      }
      if (threshold === void 0) {
        threshold = 1;
      }
      cleanup();
      const {
        left,
        top,
        width,
        height
      } = element.getBoundingClientRect();
      if (!skip) {
        onMove();
      }
      if (!width || !height) {
        return;
      }
      const insetTop = floor(top);
      const insetRight = floor(root.clientWidth - (left + width));
      const insetBottom = floor(root.clientHeight - (top + height));
      const insetLeft = floor(left);
      const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
      const options = {
        rootMargin,
        threshold: max(0, min(1, threshold)) || 1
      };
      let isFirstUpdate = true;
      function handleObserve(entries) {
        const ratio = entries[0].intersectionRatio;
        if (ratio !== threshold) {
          if (!isFirstUpdate) {
            return refresh();
          }
          if (!ratio) {
            timeoutId = setTimeout(() => {
              refresh(false, 1e-7);
            }, 100);
          } else {
            refresh(false, ratio);
          }
        }
        isFirstUpdate = false;
      }

      // Older browsers don't support a `document` as the root and will throw an
      // error.
      try {
        io = new IntersectionObserver(handleObserve, {
          ...options,
          // Handle <iframe>s
          root: root.ownerDocument
        });
      } catch (e) {
        io = new IntersectionObserver(handleObserve, options);
      }
      io.observe(element);
    }
    refresh(true);
    return cleanup;
  }

  /**
   * Automatically updates the position of the floating element when necessary.
   * Should only be called when the floating element is mounted on the DOM or
   * visible on the screen.
   * @returns cleanup function that should be invoked when the floating element is
   * removed from the DOM or hidden from the screen.
   * @see https://floating-ui.com/docs/autoUpdate
   */
  function autoUpdate(reference, floating, update, options) {
    if (options === void 0) {
      options = {};
    }
    const {
      ancestorScroll = true,
      ancestorResize = true,
      elementResize = typeof ResizeObserver === 'function',
      layoutShift = typeof IntersectionObserver === 'function',
      animationFrame = false
    } = options;
    const referenceEl = unwrapElement(reference);
    const ancestors = ancestorScroll || ancestorResize ? [...(referenceEl ? getOverflowAncestors(referenceEl) : []), ...getOverflowAncestors(floating)] : [];
    ancestors.forEach(ancestor => {
      ancestorScroll && ancestor.addEventListener('scroll', update, {
        passive: true
      });
      ancestorResize && ancestor.addEventListener('resize', update);
    });
    const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null;
    let reobserveFrame = -1;
    let resizeObserver = null;
    if (elementResize) {
      resizeObserver = new ResizeObserver(_ref => {
        let [firstEntry] = _ref;
        if (firstEntry && firstEntry.target === referenceEl && resizeObserver) {
          // Prevent update loops when using the `size` middleware.
          // https://github.com/floating-ui/floating-ui/issues/1740
          resizeObserver.unobserve(floating);
          cancelAnimationFrame(reobserveFrame);
          reobserveFrame = requestAnimationFrame(() => {
            resizeObserver && resizeObserver.observe(floating);
          });
        }
        update();
      });
      if (referenceEl && !animationFrame) {
        resizeObserver.observe(referenceEl);
      }
      resizeObserver.observe(floating);
    }
    let frameId;
    let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
    if (animationFrame) {
      frameLoop();
    }
    function frameLoop() {
      const nextRefRect = getBoundingClientRect(reference);
      if (prevRefRect && (nextRefRect.x !== prevRefRect.x || nextRefRect.y !== prevRefRect.y || nextRefRect.width !== prevRefRect.width || nextRefRect.height !== prevRefRect.height)) {
        update();
      }
      prevRefRect = nextRefRect;
      frameId = requestAnimationFrame(frameLoop);
    }
    update();
    return () => {
      ancestors.forEach(ancestor => {
        ancestorScroll && ancestor.removeEventListener('scroll', update);
        ancestorResize && ancestor.removeEventListener('resize', update);
      });
      cleanupIo && cleanupIo();
      resizeObserver && resizeObserver.disconnect();
      resizeObserver = null;
      if (animationFrame) {
        cancelAnimationFrame(frameId);
      }
    };
  }

  /**
   * Computes the `x` and `y` coordinates that will place the floating element
   * next to a reference element when it is given a certain CSS positioning
   * strategy.
   */
  const computePosition = (reference, floating, options) => {
    // This caches the expensive `getClippingElementAncestors` function so that
    // multiple lifecycle resets re-use the same result. It only lives for a
    // single call. If other functions become expensive, we can add them as well.
    const cache = new Map();
    const mergedOptions = {
      platform,
      ...options
    };
    const platformWithCache = {
      ...mergedOptions.platform,
      _c: cache
    };
    return computePosition$1(reference, floating, {
      ...mergedOptions,
      platform: platformWithCache
    });
  };

  //tooltip using floating-ui
  function Tooltip(Alpine) {
    Alpine.directive("tooltip", (el) => {
      const target =
        document.querySelector(el.getAttribute("u-tooltip-target")) ??
        el.parentNode;
      const floatingEl = el;

      console.log(target);
      target.setAttribute("u-tooltip-reference", "");

      const offsetValue = el.getAttribute("u-tooltip-offset") ?? 0;
      const placement = el.getAttribute("u-tooltip-placement") ?? "bottom";
      const margin = el.getAttribute("u-tooltip-margin") ?? 4;
      const arrowMargin = el.getAttribute("u-tooltip-arrow-margin") ?? 4;
      const trigger = el.getAttribute("u-tooltip-trigger") ?? "hover";

      const arrowEl = el.querySelector("[u-tooltip-arrow]");

      let timer;
      let cleanUp;

      function updatePosition() {
        computePosition(target, floatingEl, {
          placement,
          middleware: [
            offset(arrowEl ? 6 : offsetValue),
            flip(),
            shift({ padding: margin }),
            arrowEl ? arrow({ element: arrowEl, padding: arrowMargin }) : "",
          ],
        }).then(({ x, y, placement, middlewareData }) => {
          Object.assign(floatingEl.style, {
            left: `${x}px`,
            top: `${y}px`,
          });

          // Accessing the data
          if (!arrowEl) return;
          const { x: arrowX, y: arrowY } = middlewareData.arrow;

          const staticSide = {
            top: "bottom",
            right: "left",
            bottom: "top",
            left: "right",
          }[placement.split("-")[0]];

          Object.assign(arrowEl.style, {
            left: arrowX != null ? `${arrowX}px` : "",
            top: arrowY != null ? `${arrowY}px` : "",
            right: "",
            bottom: "",
            [staticSide]: "-4px",
          });
        });
      }

      Alpine.bind(target, () => ({
        "u-data"() {
          return {
            show() {
              clearTimeout(timer);

              Object.assign(el.style, {
                display: "block",
              });
              cleanUp = autoUpdate(target, floatingEl, () => {
                updatePosition();
              });
            },
            hide() {
              clearTimeout(timer);

              timer = setTimeout(() => {
                Object.assign(el.style, {
                  display: "none",
                });
                if (cleanUp) {
                  cleanUp();
                }
              }, 150);
            },
            toggle() {
              if (el.style.display === "block") {
                hide(this);
              } else {
                show(this);
              }
            },
          };
        },
      }));

      if (trigger == "click") {
        Alpine.bind(target, () => ({
          "u-on:focus"() {
            this.show();
          },
          "u-on:blur"() {
            this.hide();
          },
          "u-on:click"() {
            // this.toggle();
          },
        }));
      } else {
        Alpine.bind(target, () => ({
          "u-on:mouseenter"() {
            this.show();
          },
          "u-on:mouseleave"() {
            this.hide();
          },
        }));
      }
    });
  }

  //popover using floating-ui
    function Popover(Alpine) {
      Alpine.directive("popover", (el) => {
        const edge = el.querySelector('[u-popover-edge]');
        
        const target =
          document.querySelector(el.getAttribute("u-popover-target")) ?? el.parentNode;
        const floatingEl = el;
    
        console.log('target',target);
        console.log('floatingel',target);
        console.log('innerWrapper',edge);
        
        target.setAttribute('u-popover-reference', '');
        
        const offsetValue = el.getAttribute("u-popover-offset") ?? 0;
        const placement = el.getAttribute("u-popover-placement") ?? "bottom";
        const shiftMargin = el.getAttribute("u-popover-margin") ?? 4;
        const arrowEl = el.querySelector("[u-popover-arrow]");
        const trigger = el.getAttribute("u-popover-trigger") ?? "click";
        const arrowMargin = el.getAttribute("u-popover-arrow-margin") ?? 4;
        const flipAble = el.hasAttribute('u-popover-flip') ?? true;
        const shiftAble = el.hasAttribute('u-popover-shift') ?? true;
    
        let cleanUp;
    
        function updatePosition() {
          computePosition(target, floatingEl, {
            placement,
            middleware: [
              offset(offsetValue? offsetValue : arrowEl? 6: 0),
              flipAble? flip(): "",
              shiftAble? shift({ padding: shiftMargin }): "",
              arrowEl ? arrow({ element: arrowEl, padding: arrowMargin }) : "",
            ],
          }).then(({ x, y, placement, middlewareData }) => {
            Object.assign(floatingEl.style, {
              left: `${x}px`,
              top: `${y}px`,
            });
    
            // setting the arrow position if arrow exists
            if (arrowEl) {
              const { x: arrowX, y: arrowY } = middlewareData.arrow;
              const staticSide = {
                top: "bottom",
                right: "left",
                bottom: "top",
                left: "right",
              }[placement.split("-")[0]];
              
              Object.assign(arrowEl.style, {
                left: arrowX != null ? `${arrowX}px` : "",
                top: arrowY != null ? `${arrowY}px` : "",
                right: "",
                bottom: "",
                [staticSide]: "-4px",
              });
            }

            // for persisting floatingEl when hover over it
            if(edge) {
              const edgeSide = {
                bottom: "borderBottomWidth",
                left: "borderLeftWidth",
                top: "borderTopWidth",
                right: "borderRightWidth",
              }[placement.split("-")[0]];
    
              Object.assign(edge.style, {
                borderWidth: '0px',
                [edgeSide]: `${15 + offsetValue}px`,
              });
            }
          });
        }

        Alpine.bind(target, () => ({
          "u-data"() {
            return {
              show() {
                Object.assign(el.style, {
                  display: "block",
                });
                cleanUp = autoUpdate(target, floatingEl, () => {
                  updatePosition();
                });
              },
              hide() {
                Object.assign(el.style, {
                  display: "none",
                });
                if (cleanUp) {
                  cleanUp();
                }
              },
              toggle() {
                if (el.style.display === "block") {
                  hide();
                } else {
                  show();
                }
              },
            };
          },
        }));

        if (trigger == "click") {
          Alpine.bind(target, () => ({
            "u-on:focus"() {
              console.log('show');
              this.show();
            },
            "u-on:blur"() {
              this.hide();
            },
          }));
        } else {
          Alpine.bind(target, () => ({
            "u-on:mouseenter"() {
              console.log('show');
              this.show();
            },
            "u-on:mouseleave"() {
              this.hide();
            },
          }));
        }
        Alpine.bind(floatingEl, () => ({
          "u-on:mouseenter"() {
            floatingEl.focus();
          },
          "u-on:focus"() {
            floatingEl.focus();
          },
        }));

        //if the persistant is false
        if(!edge){
          Alpine.bind(floatingEl, () => ({
            "u-on:mouseenter"() {
              this.hide();
            },
            "u-on:focus"() {
              this.hide();
            },
          }));
        }
        
      });
    }

  const prefix = "u";

  function extract(...params) {
    let $props = {};
    let $slots = [];

    if (typeof params[0] === "object" && !Array.isArray(params[0])) {
      $props = params[0];

      if (typeof params[1] !== "undefined") {
        if (Array.isArray(params[1])) {
          $slots = params[1];
        } else if (typeof params[1] === "function") {
          $slots = params[1];
        } else {
          $slots = [params[1]];
        }
      }

      return { $props, $slots };
    }

    if (Array.isArray(params[0])) {
      $slots = params[0];
    } else if (typeof params[1] === "function") {
      $slots = params[1];
    } else {
      $slots = [params[0]];
    }

    return { $props, $slots };
  }

  function classname(component, cssProps = {}, globalClasses = "") {
    let classes = [];

    if (component) {
      classes.push([prefix, paramCase(component)].join("-"));
    } else {
      classes.push(prefix);
    }

    function paramCase(str) {
      return str
        .split("")
        .map((char) => {
          if ((char >= "A") & (char <= "Z")) {
            return "-" + char.toLowerCase();
          }
          return char;
        })
        .join("");
    }

    Object.keys(cssProps).map((key) => {
      let value = cssProps[key];
      if (typeof value === "number" || typeof value === "string") {
        classes.push([prefix, component, paramCase(key), value].join("-"));
      }
      if (value === true) {
        classes.push([prefix, component, paramCase(key)].join("-"));
      }
    });

    classes.push(globalClasses);
    return classes.filter(Boolean).join(" ");
  }

  function Base({ render }) {
    return (...$) => {
      const { $props = {}, $slots = [] } = extract(...$);

      let props = {};
      for (let key in $props) {
        if (typeof $props[key] !== "undefined") {
          props[key] = $props[key];
        }
      }

      return render(props, $slots);
    };
  }

  function renderScriptInternal(component) {
    if (Array.isArray(component)) {
      return component.map((x) => renderScriptInternal(x));
    }

    if (component && typeof component === "object") {
      return [
        {
          onMount: component.props.onMount,
          scriptName: component.props.scriptName,
          script: component.props.script,
        },
        renderScriptInternal(component.slots),
      ].flat(5);
    }
    return [];
  }

  function renderScripts(component) {
    if (typeof component !== "object") return;

    const scripts = renderScriptInternal(component);

    let result = "";
    let scriptsObject = scripts.reduce((prev, curr) => {
      return { ...prev, [curr.scriptName]: curr.onMount };
    }, {});

    result += Object.keys(scriptsObject)
      .map((key) => scriptsObject[key])
      .join("\n");

    result += scripts.map((script) => script.script).join("\n");

    return result;
  }

  function stringify(object) {
    if (object && typeof object === "object" || typeof object === "number") {
      return "'" + JSON.stringify(object) + "'";
    } else {
      return JSON.stringify(object);
    }
  }

  function renderAttributes({
    scriptName,
    scriptProps,
    onMount,
    script,
    ...object
  }) {
    let result = "";
    if (scriptName) {
      result += " " + scriptName + "=" + stringify(scriptProps ?? {});
    }

    for (let [key, value] of Object.entries(object)) {
      if (value === false || typeof value === "undefined" || value === null)
        continue;

      if (key === "htmlHead") {
        continue;
      }
      if (value === "") {
        result += " " + key;
      } else {
        result += " " + key + "=" + stringify(value);
      }
    }
    return result;
  }

  function renderSlots(slots) {
    return slots.map((slot) => renderTemplate(slot)).join("");
  }

  function renderTemplate(object) {
    if (typeof object === "undefined") return;
    if (Array.isArray(object))
      return object.map((item) => renderTemplate(item)).join("\n");
    if (object && typeof object === "object") {
      const { tag, slots, props } = object;

      if (!tag) return "";

      return (
        `<${tag}${renderAttributes(props)}>` + renderSlots(slots) + `</${tag}>`
      );
    }
    return object;
  }


  function renderHead(object) {
    if (typeof object === "undefined") return;
    if (Array.isArray(object))
      return object.map((item) => renderHead(item)).join("\n");
    if (object && typeof object === "object") {
      const { tag, slots, props } = object;

      return [props?.htmlHead ? renderTemplate(props.htmlHead) :"", ...slots?.map((slot) => renderHead(slot))]
        .join("\n")
        .trim();
    }
    return "";
  }

  function tag(tagName, props = {}, ...slots) {

    if(typeof tagName === 'object') {
      return tag(tagName.tag, tagName.props, tagName.slots)
    }
    
    return {
      tag: tagName,
      props,
      slots,
      toString() {
        return renderTemplate(this);
      },
      toHead() {
        return renderHead(this);
      },
      toScript() {
        return renderScripts(this);
      },
      toHtml() {
        return `<!DOCTYPE html>
<html>
  <head>
    ${this.toHead()}
  </head>
  <body>
    ${this.toString()}
    <script>
      ${this.toScript()}
    </script>
  </body>
</html>`
      }
    };
  }

  // Not implemented
  // border directions (only border bottom, ....)

  //* bgColor (primary, secondary, success, info, warning, danger, light, dark)
  //* textColor (primary, secondary, success, info, warning, danger, light, dark)
  //* borderRadius (xs, sm, md, lg, xl)
  //* borderColor (primary, secondary, success, info, warning, danger, light, dark)
  //* borderSize (xs, sm, md, lg, xl)
  //* d(flex, inline, block, grid, contents, inline-flex, inline-block, none)
  //* dXs (flex, inline, block, grid, contents, inline-flex, inline-block, none)
  //* dSm (flex, inline, block, grid, contents, inline-flex, inline-block, none)
  //* dMd (flex, inline, block, grid, contents, inline-flex, inline-block, none)
  //* dLg (flex, inline, block, grid, contents, inline-flex, inline-block, none)
  //* dXl (flex, inline, block, grid, contents, inline-flex, inline-block, none)
  //* align (start, center, end, baseline, stretch)
  //* alignSelf (start, center, end, baseline, stretch)
  //* justify (start, center, end, between, evenly, around)
  //* justifySelf (start, center, end, between, evenly, around)
  //* flexDirection (row, column, row-reverse, column-reverse)
  //* flexDirectionXs (row, column, row-reverse, column-reverse)
  //* flexDirectionSm (row, column, row-reverse, column-reverse)
  //* flexDirectionMd (row, column, row-reverse, column-reverse)
  //* flexDirectionLg (row, column, row-reverse, column-reverse)
  //* flexDirectionXl (row, column, row-reverse, column-reverse)
  //* gap (0, sm, md, lg, xl)
  //* wrap (true, false)
  //* w (width) (0, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, auto, 50, 100)
  //* h (height) (0, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, auto, 50, 100)

  const View = Base({
    render($props, $slots) {
      const {
        tag: tagName = "div",
        component = "view",
        cssProps = {},
        m,
        p,
        mx,
        px,
        ms,
        ps,
        my,
        py,
        me,
        pe,
        mt,
        pt,
        mb,
        pb,
        w,
        h,
        d,
        dXs,
        dSm,
        dMd,
        dLg,
        dXl,
        gap,
        align,
        alignSelf,
        justify,
        justifySelf,
        flexDirection,
        flexDirectionXs,
        flexDirectionSm,
        flexDirectionMd,
        flexDirectionLg,
        flexDirectionXl,
        bgColor,
        textColor,
        borderSize,
        border,
        borderColor,
        borderRadius,
        wrap,
        ...restProps
      } = $props;

      const viewCssProps = {
        m,
        p,
        mx,
        px,
        ms,
        ps,
        my,
        py,
        me,
        pe,
        mt,
        pt,
        mb,
        pb,
        w,
        h,
        d,
        dXs,
        dSm,
        dMd,
        dLg,
        dXl,
        gap,
        align,
        wrap,
        flexDirection,
        flexDirectionXs,
        flexDirectionSm,
        flexDirectionMd,
        flexDirectionLg,
        flexDirectionXl,
        alignSelf,
        justify,
        justifySelf,
        bgColor,
        textColor,
        borderSize,
        border,
        borderColor,
        borderRadius,
      };

      const cssAttributes = {};

      for (let prop in cssProps) {
        if (typeof cssProps[prop] !== "undefined")
          if (cssProps[prop] === true) {
            cssAttributes[classname(component + "-" + prop)] = "";
          } else {
            cssAttributes[classname(component + "-" + prop)] = cssProps[prop];
          }
      }
      for (let prop in viewCssProps) {
        if (typeof viewCssProps[prop] !== "undefined")
          if (viewCssProps[prop] === true) {
            cssAttributes[classname("view-" + prop)] = "";
          } else {
            cssAttributes[classname("view-" + prop)] = viewCssProps[prop];
          }
      }

      const props = {
        [classname(component)]: component === "view" ? false : "",
        ...restProps,
        ...cssAttributes,
      };

      for (let key in props) {
        if (key.startsWith("on") && key[2] >= "A" && key[2] <= "Z") {
          let event = key.substring(2).toLocaleLowerCase();

          if (event === "init") {
            props["u-init"] = props[key];
          } else {
            props["u-on:" + event] = props[key];
          }

          delete props[key];
        } else if (key.startsWith("$")) {
          if (key === "$if") {
            props["u-if"] = props[key];
          } else if (key === "$text") {
            props["u-text"] = props[key];
          } else if (key === "$html") {
            props["u-html"] = props[key];
          } else if (key === "$for") {
            props["u-for"] = props[key];
          } else {
            props[`u-bind:` + key.substring(1)] = props[key];
          }
          delete props[key];
        } else {
          if (props[key] === true) {
            props[key] = "";
          }
        }
      }

      return tag(tagName, props, $slots);
    },
  });

  const Icon = Base({
    render({ $name, name, size, color, ...restProps }, slots) {
      const result = View({
        ...restProps,
        tag: "span",
        component: "icon",
        cssProps: { size },
        textColor: color,
        name,
        $name
      });
      return result;
    },
  });

  const Alert$1 = Base({
    render($props, $slots) {
      const {
        component = "alert",
        autoClose = false,
        duration = 5000,
        open = true,
        icon,
        color = "primary",
        dismissible = false,
        title,
        ...restProps
      } = $props;

      const props = {
        ...restProps,
        component,
        duration: autoClose ? duration : undefined,
        cssProps: {
          color,
          autoClose,
          open,
        },
      };

      return View(props, [
        View({ component: component + "-header" }, [
          (icon &&
            Icon({ [classname(component + "-icon")]: true, color }, icon)) ||
            [],
          View({ component: component + "-title" }, title ?? ''),
          (dismissible &&
            View(
              { tag: "button", component: component + "-close" },
              Icon("x")
            )) ||
            [],
        ]),
        ($slots.toString() !== "" &&
          View({ component: component + "-content" }, $slots)) ||
          [],
      ]);
    },
  });

  function Alert(Alpine) {
      Alpine.directive('alert', (el) => {
          const isOpen = el.getAttribute('u-alert-open');       

          Alpine.bind(el, {
              'u-data'() {
                  return {
                      isOpen,
                  }
              },
              'u-bind:u-alert-open'() {
                  return this.$data.isOpen
              }
          });
          
      });
      Alpine.directive('alert-close', (el) => {
          console.log('close button', el);
          Alpine.bind(el, {
              'u-on:click'() {
                  this.$data.isOpen = false;
              }
          });
      });

      Alpine.directive('alert-auto-close', (el) => {
          Alpine.bind(el, {
              'u-init'() {
                  setTimeout(() => {
                      this.$data.isOpen = false;
                  }, +el.getAttribute('duration') ?? 5000);
              }
          });
      });

      Alpine.magic('alert', (el) => {
          

          const alert = (name, {title, icon = 'check', content = '', ...restProps}) => {
              let container = document.querySelector(`[u-alert-container][name="${name}"]`);

              // first container
              if(!name) container = document.querySelector('[u-alert-container]');

              const al = document.createElement('div');
              al.innerHTML = Alert$1({title, icon, ...restProps}, content);

              setTimeout(() => {
                  container.appendChild(al);
              }, 100);
          };

          alert.success = (message, title = 'Success') => alert(undefined, {content: message, type: 'success', title, icon: 'check'});
          alert.info = (message, title = 'Info') => alert(undefined, {content: message, type: 'info', title, icon: 'info-circle'});
          alert.warning = (message, title = 'Warning') => alert(undefined, {content: message, type: 'warning', title, icon: 'info-triangle'});
          alert.error = (message, title = 'Error') => alert(undefined, {content: message, type: 'error', title, icon: 'alert-triangle'});
          
          return alert
      });
  }

  function Switch(Alpine) {
    Alpine.directive("switch-input", (el) => {
      Alpine.bind(el, {
        "u-init"() {
          this.$data.name = el.getAttribute("name");
        },
        "u-on:change"(e) {
          this.$data[el.getAttribute("name")] = e.target.checked;
        },
      });
    });
  }

  // import hljs from 'highlight.js/lib/core';
  // import javascript from 'highlight.js/lib/languages/javascript';
  // hljs.registerLanguage('javascript', javascript);

  function components(Alpine) {

    // Alpine.directive('code-viewer', (el) => {
    //   const prism = hljs.highlightElement(el, true, (result) => {
    //     console.log(result)
    //   })
    //   console.log(prism)
    // })
    
    Alert(Alpine);
    Popup(Alpine);
    ClientSideRouting(Alpine);
    Checkbox(Alpine);
    Radio(Alpine);
    Select(Alpine);
    Input(Alpine);
    Textarea(Alpine);
    Form(Alpine);
    Accordion(Alpine);
    Switch(Alpine);
    Icon$1(Alpine);
    AutoComplete(Alpine);
    Modal(Alpine);
    Tabs(Alpine);
    Dropdown(Alpine);
    Tooltip(Alpine);
    Popover(Alpine);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if(!document.body.hasAttribute('u-data')) {
      document.body.setAttribute("u-data", "");
    }
    
    module_default.prefix("u-");
    module_default.plugin(components);

    window.Alpine = module_default;
    module_default.start();
  });

})();
