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
    Alpine.directive("icon", (el, {}, {evaluateLater, effect}) => {
      const iconName = el.getAttribute('u-bind:name');
      const staticName = el.getAttribute('name');

      async function setIcon(value) {
        try {
          const res = await fetch(
            `https://unpkg.com/@tabler/icons@2.19.0/icons/${value}.svg`
          );
          const svg = await res.text();

          if (svg.indexOf("Cannot") > -1) {
            el.innerHTML = "";
          } else {
            el.innerHTML = svg;
          }
        } catch (err) {
          el.innerHTML = "";
          //
        }
      }

      const evaluate = evaluateLater(iconName);

      effect(() => {
        evaluate((value) => {
          setIcon(value);
        });
      });

      if(staticName) {
        setIcon(staticName);
      }
    });
  }

  function Form(Alpine) {
    // const handlers = {
    //   input: (el) => ({
    //     name: el.name,
    //     get: () => el.value,
    //     set: (value) => (el.value = value),
    //   }),
    //   checkbox: (el) => {
    //     const checkbox = el.querySelector("[u-checkbox-input]");

    //     return {
    //       name: checkbox.name,
    //       get: () => checkbox.checked,
    //       set: (value) => (checkbox.checked = value),
    //     };
    //   },
    //   switch: (el) => {
    //     const switchEl = el.querySelector("[u-switch-input]");

    //     return {
    //       name: switchEl.name,
    //       get: () => switchEl.checked,
    //       set: (value) => (switchEl.checked = value),
    //     };
    //   },
    //   "checkbox-group": (el) => {
    //     // el._model.get
    //     const name = el.getAttribute("name");

    //     return {
    //       name,
    //       get: () => {
    //         let value = [];

    //         el.querySelectorAll("[u-checkbox-group-item-input]").forEach(
    //           (item) => {
    //             if (item.checked) {
    //               value = [...value, item.value];
    //             }
    //           }
    //         );

    //         return value;
    //       },
    //       set(value) {
    //         console.log("set value of checkbox group to", value);

    //         el.querySelectorAll("[u-checkbox-group-item-input]").forEach(
    //           (item) => {
    //             if (value.includes(item.value)) {
    //               item.checked = true;
    //             } else {
    //               item.checked = false;
    //             }
    //           }
    //         );
    //       },
    //     };
    //   },
    //   "radio-group": (el) => {
    //     const name = el.getAttribute("name");

    //     return {
    //       name,
    //       get: () => {
    //         let value = "";

    //         el.querySelectorAll("[u-radio-group-item-input]").forEach((item) => {
    //           if (item.checked) {
    //             value = item.value;
    //           }
    //         });
    //         return value;
    //       },
    //       set: (value) => {
    //         el.querySelectorAll("[u-radio-group-item-input]").forEach((item) => {
    //           console.log("radio group", item.value, value);
    //           if (item.value === value) {
    //             item.checked = true;
    //           }
    //         });
    //       },
    //     };
    //   },
    //   select: (el) => {
    //     const name = el.getAttribute("name");
    //     const multiple = el.getAttribute("multiple");

    //     return {
    //       name,
    //       get() {
    //         if (multiple) {
    //           const selected = Array.from(el.selectedOptions)
    //             .map((option) => option.value)
    //             .filter((x) => !!x);

    //           return selected;
    //         } else {
    //           const selected = el.selectedOptions[0];

    //           console.log(selected);
    //           if (selected) return selected.value;
    //           return undefined;
    //         }
    //       },
    //       set(value) {
    //         console.log("set value of select to", value);
    //         if (Array.isArray(value)) {
    //           Array.from(el.options).map((option) => {
    //             if (value.includes(option.value)) option.selected = true;
    //             else option.selected = false;
    //           });
    //         } else {
    //           el.value = value;
    //         }
    //       },
    //     };
    //   },
    //   textarea(el) {
    //     const name = el.getAttribute("name");

    //     return {
    //       name,
    //       get: () => el.value,
    //       set: (value) => (el.value = value),
    //     };
    //   },
    // };

    Alpine.directive("form", (el, {}, {evaluateLater}) => {
      Alpine.bind(el, {
        'u-data'() {
          const result = {};

          return result
        }
      });
    });
    
    //   let actionFn;

    //   let method = el.getAttribute('method')
   
    //   if(method === 'FUNCTION') {
    //     actionFn = evaluateLater(el.getAttribute('action'))
    //     // console.log(actionFn(el, el, value))
        
    //   }

    //   const fields = {};

    //   const formValue = JSON.parse(el.getAttribute("value") ?? "{}");

    //   for (let input in handlers) {
    //     el.querySelectorAll(`[u-${input}]`).forEach((el) => {
    //       const { name, get, set } = handlers[input](el);

    //       if (typeof formValue[name] !== "undefined") {
    //         set(formValue[name]);
    //       }

    //       fields[name] = { get, set };
    //     });
    //   }

    //   Alpine.bind(el, {
    //     "u-data"() {
    //       let result = {};

    //       for (let field in fields) {
    //         result[field] = fields[field].get();
    //       }
    //       return result;
    //     },
    //   });

    //   Alpine.bind(el, {
    //     async "u-on:submit"(event) {
    //       const value = {};
    //       event.preventDefault();
          
    //       event.stopPropagation();

    //       Object.keys(fields).map((key) => {
    //         value[key] = fields[key].get();
    //       });

    //       if (el.getAttribute("method") === "FUNCTION") {          

    //         const result = await actionFn((v) => v, { scope: { '$value': value }, params: [value] })

    //       } else {
    //         const pathname = window.location.pathname;

    //         const url = pathname.endsWith("/")
    //           ? pathname.substring(0, pathname.length - 1)
    //           : pathname + "?" + el.getAttribute("action");

    //         try {
    //           const result = await fetch(url, {
    //             method: "POST", // el.method,
    //             headers: {
    //               "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify(value),
    //           }).then((res) => res.json());

    //           console.log({ result });
    //         } catch (err) {
    //           console.log(err);
    //         }
    //       }
    //     },
    //   });
    // });


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

  function Input(Alpine) {
    
      Alpine.directive("input", (el) => {
        Alpine.bind(el, {
          // initial value
          'u-init'() {
            if(el.value) {
              this.$data[el.getAttribute('name')] = el.value;
            } else {
              el.value = this.$data[el.getAttribute('name')];
            }
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

          // Alpine.bind(el, {
          //     'u-on:input'(e) {
          //         this.$data[el.getAttribute('name')] = e.target.value
          //     }
          // })
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

  function extract(allProps, names) {
    const restProps = { ...allProps };
    const result = names;

    Object.keys(names).map((key) => {
      if (typeof names[key] === "object") {
        result[key] = names[key];
        Object.keys(names[key]).map((key2) => {
          if (allProps[key2]) {
            result[key][key2] = allProps[key2];
            delete restProps[key2];
          }
          if (allProps["$" + key2]) {
            result[key]["$" + key2] = allProps["$" + key2];
            delete restProps["$" + key2];
          }
        });
      } else {
        if (allProps[key]) {
          result[key] = allProps[key];
          delete restProps[key];
        }
        if (allProps["$" + key]) {
          result["$" + key] = allProps["$" + key] ?? names["$" + key];
          delete restProps["$" + key];
        }
      }
    });

    return [result, restProps];
  }

  function getPropsAndSlots(...params) {
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
      const { $props = {}, $slots = [] } = getPropsAndSlots(...$);

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

  // import { renderHead, renderScripts, renderTemplate } from "./index.js";
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

      // console.log({cssProps})
      const cssAttributes = {};

      for (let prop in cssProps) {
        if (typeof cssProps[prop] !== "undefined") {
          if(prop.startsWith('$')) continue;
          if (cssProps[prop] === true) {
            cssAttributes[classname(component + "-" + prop)] = "";
          } else {
            cssAttributes[classname(component + "-" + prop)] = cssProps[prop];
          }
        }
        if (typeof cssProps['$' + prop] !== "undefined") {
          if (cssProps['$' + prop] === true) {
            cssAttributes[classname('bind') + ':' + classname(component + "-" + prop)] = "";
          } else {
            cssAttributes[classname('bind') + ':' + classname(component + "-" + prop)] = cssProps['$' + prop];
          }
        }
      }
      for (let prop in viewCssProps) {
        if (typeof viewCssProps[prop] !== "undefined") {
          // console.log('add this prop: ', prop)

          if(prop.startsWith('$')) continue;
          if (viewCssProps[prop] === true) {
            cssAttributes[classname("view-" + prop)] = "";
          } else {
            cssAttributes[classname("view-" + prop)] = viewCssProps[prop];
          }
        }
        if (typeof $props['$' + prop] !== "undefined") {
          // console.log('add this prop: $' + prop)

          cssAttributes[classname('bind') + ':' + classname("view-" + prop)] = $props['$' + prop];
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
          } else if (key === "$show") {
            props["u-show"] = props[key];
          } else if (key === "$data") {
            props["u-data"] = props[key];
          } else if (key === "$html") {
            props["u-html"] = props[key];
          } else if (key === "$for") {
            props["u-for"] = props[key];
          } else if (key === "$model") {
            props["u-model"] = props[key];
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
      const [props, restProps] = extract($props, {
        component: "alert",
        duration: 5000,
        icon: undefined,
        dismissible: false,
        title: undefined,
        cssProps: {
          autoClose: false,
          open: true,
          color: "primary",
        },
      });
      const component = props.component;

      const alertProps = {
        ...restProps,
        component: props.component,
        duration: props.autoClose ? props.duration : undefined,
        cssProps: props.cssProps,
      };

      const iconProps = {
        [classname(component + "-icon")]: "",
        color: props.cssProps.color,
        $color: props.cssProps.$color,
        name: props.icon,
        $name: props.$icon,
      };

      return View(alertProps, [
        View({ component: component + "-header" }, [
          props.icon ? Icon(iconProps) : [],
          View({ component: component + "-title" }, props.title ?? ""),
          
            View(
              { tag: "button", $show: props.dismissible, component: component + "-close" },
              Icon({ name: "x" })
            ),
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

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  var quill = {exports: {}};

  /*!
   * Quill Editor v1.3.7
   * https://quilljs.com/
   * Copyright (c) 2014, Jason Chen
   * Copyright (c) 2013, salesforce.com
   */

  (function (module, exports) {
  	(function webpackUniversalModuleDefinition(root, factory) {
  		module.exports = factory();
  	})(typeof self !== 'undefined' ? self : commonjsGlobal, function() {
  	return /******/ (function(modules) { // webpackBootstrap
  	/******/ 	// The module cache
  	/******/ 	var installedModules = {};
  	/******/
  	/******/ 	// The require function
  	/******/ 	function __webpack_require__(moduleId) {
  	/******/
  	/******/ 		// Check if module is in cache
  	/******/ 		if(installedModules[moduleId]) {
  	/******/ 			return installedModules[moduleId].exports;
  	/******/ 		}
  	/******/ 		// Create a new module (and put it into the cache)
  	/******/ 		var module = installedModules[moduleId] = {
  	/******/ 			i: moduleId,
  	/******/ 			l: false,
  	/******/ 			exports: {}
  	/******/ 		};
  	/******/
  	/******/ 		// Execute the module function
  	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
  	/******/
  	/******/ 		// Flag the module as loaded
  	/******/ 		module.l = true;
  	/******/
  	/******/ 		// Return the exports of the module
  	/******/ 		return module.exports;
  	/******/ 	}
  	/******/
  	/******/
  	/******/ 	// expose the modules object (__webpack_modules__)
  	/******/ 	__webpack_require__.m = modules;
  	/******/
  	/******/ 	// expose the module cache
  	/******/ 	__webpack_require__.c = installedModules;
  	/******/
  	/******/ 	// define getter function for harmony exports
  	/******/ 	__webpack_require__.d = function(exports, name, getter) {
  	/******/ 		if(!__webpack_require__.o(exports, name)) {
  	/******/ 			Object.defineProperty(exports, name, {
  	/******/ 				configurable: false,
  	/******/ 				enumerable: true,
  	/******/ 				get: getter
  	/******/ 			});
  	/******/ 		}
  	/******/ 	};
  	/******/
  	/******/ 	// getDefaultExport function for compatibility with non-harmony modules
  	/******/ 	__webpack_require__.n = function(module) {
  	/******/ 		var getter = module && module.__esModule ?
  	/******/ 			function getDefault() { return module['default']; } :
  	/******/ 			function getModuleExports() { return module; };
  	/******/ 		__webpack_require__.d(getter, 'a', getter);
  	/******/ 		return getter;
  	/******/ 	};
  	/******/
  	/******/ 	// Object.prototype.hasOwnProperty.call
  	/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
  	/******/
  	/******/ 	// __webpack_public_path__
  	/******/ 	__webpack_require__.p = "";
  	/******/
  	/******/ 	// Load entry module and return exports
  	/******/ 	return __webpack_require__(__webpack_require__.s = 109);
  	/******/ })
  	/************************************************************************/
  	/******/ ([
  	/* 0 */
  	/***/ (function(module, exports, __webpack_require__) {

  	Object.defineProperty(exports, "__esModule", { value: true });
  	var container_1 = __webpack_require__(17);
  	var format_1 = __webpack_require__(18);
  	var leaf_1 = __webpack_require__(19);
  	var scroll_1 = __webpack_require__(45);
  	var inline_1 = __webpack_require__(46);
  	var block_1 = __webpack_require__(47);
  	var embed_1 = __webpack_require__(48);
  	var text_1 = __webpack_require__(49);
  	var attributor_1 = __webpack_require__(12);
  	var class_1 = __webpack_require__(32);
  	var style_1 = __webpack_require__(33);
  	var store_1 = __webpack_require__(31);
  	var Registry = __webpack_require__(1);
  	var Parchment = {
  	    Scope: Registry.Scope,
  	    create: Registry.create,
  	    find: Registry.find,
  	    query: Registry.query,
  	    register: Registry.register,
  	    Container: container_1.default,
  	    Format: format_1.default,
  	    Leaf: leaf_1.default,
  	    Embed: embed_1.default,
  	    Scroll: scroll_1.default,
  	    Block: block_1.default,
  	    Inline: inline_1.default,
  	    Text: text_1.default,
  	    Attributor: {
  	        Attribute: attributor_1.default,
  	        Class: class_1.default,
  	        Style: style_1.default,
  	        Store: store_1.default,
  	    },
  	};
  	exports.default = Parchment;


  	/***/ }),
  	/* 1 */
  	/***/ (function(module, exports, __webpack_require__) {

  	var __extends = (this && this.__extends) || (function () {
  	    var extendStatics = Object.setPrototypeOf ||
  	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
  	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
  	    return function (d, b) {
  	        extendStatics(d, b);
  	        function __() { this.constructor = d; }
  	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  	    };
  	})();
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var ParchmentError = /** @class */ (function (_super) {
  	    __extends(ParchmentError, _super);
  	    function ParchmentError(message) {
  	        var _this = this;
  	        message = '[Parchment] ' + message;
  	        _this = _super.call(this, message) || this;
  	        _this.message = message;
  	        _this.name = _this.constructor.name;
  	        return _this;
  	    }
  	    return ParchmentError;
  	}(Error));
  	exports.ParchmentError = ParchmentError;
  	var attributes = {};
  	var classes = {};
  	var tags = {};
  	var types = {};
  	exports.DATA_KEY = '__blot';
  	var Scope;
  	(function (Scope) {
  	    Scope[Scope["TYPE"] = 3] = "TYPE";
  	    Scope[Scope["LEVEL"] = 12] = "LEVEL";
  	    Scope[Scope["ATTRIBUTE"] = 13] = "ATTRIBUTE";
  	    Scope[Scope["BLOT"] = 14] = "BLOT";
  	    Scope[Scope["INLINE"] = 7] = "INLINE";
  	    Scope[Scope["BLOCK"] = 11] = "BLOCK";
  	    Scope[Scope["BLOCK_BLOT"] = 10] = "BLOCK_BLOT";
  	    Scope[Scope["INLINE_BLOT"] = 6] = "INLINE_BLOT";
  	    Scope[Scope["BLOCK_ATTRIBUTE"] = 9] = "BLOCK_ATTRIBUTE";
  	    Scope[Scope["INLINE_ATTRIBUTE"] = 5] = "INLINE_ATTRIBUTE";
  	    Scope[Scope["ANY"] = 15] = "ANY";
  	})(Scope = exports.Scope || (exports.Scope = {}));
  	function create(input, value) {
  	    var match = query(input);
  	    if (match == null) {
  	        throw new ParchmentError("Unable to create " + input + " blot");
  	    }
  	    var BlotClass = match;
  	    var node = 
  	    // @ts-ignore
  	    input instanceof Node || input['nodeType'] === Node.TEXT_NODE ? input : BlotClass.create(value);
  	    return new BlotClass(node, value);
  	}
  	exports.create = create;
  	function find(node, bubble) {
  	    if (bubble === void 0) { bubble = false; }
  	    if (node == null)
  	        return null;
  	    // @ts-ignore
  	    if (node[exports.DATA_KEY] != null)
  	        return node[exports.DATA_KEY].blot;
  	    if (bubble)
  	        return find(node.parentNode, bubble);
  	    return null;
  	}
  	exports.find = find;
  	function query(query, scope) {
  	    if (scope === void 0) { scope = Scope.ANY; }
  	    var match;
  	    if (typeof query === 'string') {
  	        match = types[query] || attributes[query];
  	        // @ts-ignore
  	    }
  	    else if (query instanceof Text || query['nodeType'] === Node.TEXT_NODE) {
  	        match = types['text'];
  	    }
  	    else if (typeof query === 'number') {
  	        if (query & Scope.LEVEL & Scope.BLOCK) {
  	            match = types['block'];
  	        }
  	        else if (query & Scope.LEVEL & Scope.INLINE) {
  	            match = types['inline'];
  	        }
  	    }
  	    else if (query instanceof HTMLElement) {
  	        var names = (query.getAttribute('class') || '').split(/\s+/);
  	        for (var i in names) {
  	            match = classes[names[i]];
  	            if (match)
  	                break;
  	        }
  	        match = match || tags[query.tagName];
  	    }
  	    if (match == null)
  	        return null;
  	    // @ts-ignore
  	    if (scope & Scope.LEVEL & match.scope && scope & Scope.TYPE & match.scope)
  	        return match;
  	    return null;
  	}
  	exports.query = query;
  	function register() {
  	    var Definitions = [];
  	    for (var _i = 0; _i < arguments.length; _i++) {
  	        Definitions[_i] = arguments[_i];
  	    }
  	    if (Definitions.length > 1) {
  	        return Definitions.map(function (d) {
  	            return register(d);
  	        });
  	    }
  	    var Definition = Definitions[0];
  	    if (typeof Definition.blotName !== 'string' && typeof Definition.attrName !== 'string') {
  	        throw new ParchmentError('Invalid definition');
  	    }
  	    else if (Definition.blotName === 'abstract') {
  	        throw new ParchmentError('Cannot register abstract class');
  	    }
  	    types[Definition.blotName || Definition.attrName] = Definition;
  	    if (typeof Definition.keyName === 'string') {
  	        attributes[Definition.keyName] = Definition;
  	    }
  	    else {
  	        if (Definition.className != null) {
  	            classes[Definition.className] = Definition;
  	        }
  	        if (Definition.tagName != null) {
  	            if (Array.isArray(Definition.tagName)) {
  	                Definition.tagName = Definition.tagName.map(function (tagName) {
  	                    return tagName.toUpperCase();
  	                });
  	            }
  	            else {
  	                Definition.tagName = Definition.tagName.toUpperCase();
  	            }
  	            var tagNames = Array.isArray(Definition.tagName) ? Definition.tagName : [Definition.tagName];
  	            tagNames.forEach(function (tag) {
  	                if (tags[tag] == null || Definition.className == null) {
  	                    tags[tag] = Definition;
  	                }
  	            });
  	        }
  	    }
  	    return Definition;
  	}
  	exports.register = register;


  	/***/ }),
  	/* 2 */
  	/***/ (function(module, exports, __webpack_require__) {

  	var diff = __webpack_require__(51);
  	var equal = __webpack_require__(11);
  	var extend = __webpack_require__(3);
  	var op = __webpack_require__(20);


  	var NULL_CHARACTER = String.fromCharCode(0);  // Placeholder char for embed in diff()


  	var Delta = function (ops) {
  	  // Assume we are given a well formed ops
  	  if (Array.isArray(ops)) {
  	    this.ops = ops;
  	  } else if (ops != null && Array.isArray(ops.ops)) {
  	    this.ops = ops.ops;
  	  } else {
  	    this.ops = [];
  	  }
  	};


  	Delta.prototype.insert = function (text, attributes) {
  	  var newOp = {};
  	  if (text.length === 0) return this;
  	  newOp.insert = text;
  	  if (attributes != null && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
  	    newOp.attributes = attributes;
  	  }
  	  return this.push(newOp);
  	};

  	Delta.prototype['delete'] = function (length) {
  	  if (length <= 0) return this;
  	  return this.push({ 'delete': length });
  	};

  	Delta.prototype.retain = function (length, attributes) {
  	  if (length <= 0) return this;
  	  var newOp = { retain: length };
  	  if (attributes != null && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
  	    newOp.attributes = attributes;
  	  }
  	  return this.push(newOp);
  	};

  	Delta.prototype.push = function (newOp) {
  	  var index = this.ops.length;
  	  var lastOp = this.ops[index - 1];
  	  newOp = extend(true, {}, newOp);
  	  if (typeof lastOp === 'object') {
  	    if (typeof newOp['delete'] === 'number' && typeof lastOp['delete'] === 'number') {
  	      this.ops[index - 1] = { 'delete': lastOp['delete'] + newOp['delete'] };
  	      return this;
  	    }
  	    // Since it does not matter if we insert before or after deleting at the same index,
  	    // always prefer to insert first
  	    if (typeof lastOp['delete'] === 'number' && newOp.insert != null) {
  	      index -= 1;
  	      lastOp = this.ops[index - 1];
  	      if (typeof lastOp !== 'object') {
  	        this.ops.unshift(newOp);
  	        return this;
  	      }
  	    }
  	    if (equal(newOp.attributes, lastOp.attributes)) {
  	      if (typeof newOp.insert === 'string' && typeof lastOp.insert === 'string') {
  	        this.ops[index - 1] = { insert: lastOp.insert + newOp.insert };
  	        if (typeof newOp.attributes === 'object') this.ops[index - 1].attributes = newOp.attributes;
  	        return this;
  	      } else if (typeof newOp.retain === 'number' && typeof lastOp.retain === 'number') {
  	        this.ops[index - 1] = { retain: lastOp.retain + newOp.retain };
  	        if (typeof newOp.attributes === 'object') this.ops[index - 1].attributes = newOp.attributes;
  	        return this;
  	      }
  	    }
  	  }
  	  if (index === this.ops.length) {
  	    this.ops.push(newOp);
  	  } else {
  	    this.ops.splice(index, 0, newOp);
  	  }
  	  return this;
  	};

  	Delta.prototype.chop = function () {
  	  var lastOp = this.ops[this.ops.length - 1];
  	  if (lastOp && lastOp.retain && !lastOp.attributes) {
  	    this.ops.pop();
  	  }
  	  return this;
  	};

  	Delta.prototype.filter = function (predicate) {
  	  return this.ops.filter(predicate);
  	};

  	Delta.prototype.forEach = function (predicate) {
  	  this.ops.forEach(predicate);
  	};

  	Delta.prototype.map = function (predicate) {
  	  return this.ops.map(predicate);
  	};

  	Delta.prototype.partition = function (predicate) {
  	  var passed = [], failed = [];
  	  this.forEach(function(op) {
  	    var target = predicate(op) ? passed : failed;
  	    target.push(op);
  	  });
  	  return [passed, failed];
  	};

  	Delta.prototype.reduce = function (predicate, initial) {
  	  return this.ops.reduce(predicate, initial);
  	};

  	Delta.prototype.changeLength = function () {
  	  return this.reduce(function (length, elem) {
  	    if (elem.insert) {
  	      return length + op.length(elem);
  	    } else if (elem.delete) {
  	      return length - elem.delete;
  	    }
  	    return length;
  	  }, 0);
  	};

  	Delta.prototype.length = function () {
  	  return this.reduce(function (length, elem) {
  	    return length + op.length(elem);
  	  }, 0);
  	};

  	Delta.prototype.slice = function (start, end) {
  	  start = start || 0;
  	  if (typeof end !== 'number') end = Infinity;
  	  var ops = [];
  	  var iter = op.iterator(this.ops);
  	  var index = 0;
  	  while (index < end && iter.hasNext()) {
  	    var nextOp;
  	    if (index < start) {
  	      nextOp = iter.next(start - index);
  	    } else {
  	      nextOp = iter.next(end - index);
  	      ops.push(nextOp);
  	    }
  	    index += op.length(nextOp);
  	  }
  	  return new Delta(ops);
  	};


  	Delta.prototype.compose = function (other) {
  	  var thisIter = op.iterator(this.ops);
  	  var otherIter = op.iterator(other.ops);
  	  var ops = [];
  	  var firstOther = otherIter.peek();
  	  if (firstOther != null && typeof firstOther.retain === 'number' && firstOther.attributes == null) {
  	    var firstLeft = firstOther.retain;
  	    while (thisIter.peekType() === 'insert' && thisIter.peekLength() <= firstLeft) {
  	      firstLeft -= thisIter.peekLength();
  	      ops.push(thisIter.next());
  	    }
  	    if (firstOther.retain - firstLeft > 0) {
  	      otherIter.next(firstOther.retain - firstLeft);
  	    }
  	  }
  	  var delta = new Delta(ops);
  	  while (thisIter.hasNext() || otherIter.hasNext()) {
  	    if (otherIter.peekType() === 'insert') {
  	      delta.push(otherIter.next());
  	    } else if (thisIter.peekType() === 'delete') {
  	      delta.push(thisIter.next());
  	    } else {
  	      var length = Math.min(thisIter.peekLength(), otherIter.peekLength());
  	      var thisOp = thisIter.next(length);
  	      var otherOp = otherIter.next(length);
  	      if (typeof otherOp.retain === 'number') {
  	        var newOp = {};
  	        if (typeof thisOp.retain === 'number') {
  	          newOp.retain = length;
  	        } else {
  	          newOp.insert = thisOp.insert;
  	        }
  	        // Preserve null when composing with a retain, otherwise remove it for inserts
  	        var attributes = op.attributes.compose(thisOp.attributes, otherOp.attributes, typeof thisOp.retain === 'number');
  	        if (attributes) newOp.attributes = attributes;
  	        delta.push(newOp);

  	        // Optimization if rest of other is just retain
  	        if (!otherIter.hasNext() && equal(delta.ops[delta.ops.length - 1], newOp)) {
  	          var rest = new Delta(thisIter.rest());
  	          return delta.concat(rest).chop();
  	        }

  	      // Other op should be delete, we could be an insert or retain
  	      // Insert + delete cancels out
  	      } else if (typeof otherOp['delete'] === 'number' && typeof thisOp.retain === 'number') {
  	        delta.push(otherOp);
  	      }
  	    }
  	  }
  	  return delta.chop();
  	};

  	Delta.prototype.concat = function (other) {
  	  var delta = new Delta(this.ops.slice());
  	  if (other.ops.length > 0) {
  	    delta.push(other.ops[0]);
  	    delta.ops = delta.ops.concat(other.ops.slice(1));
  	  }
  	  return delta;
  	};

  	Delta.prototype.diff = function (other, index) {
  	  if (this.ops === other.ops) {
  	    return new Delta();
  	  }
  	  var strings = [this, other].map(function (delta) {
  	    return delta.map(function (op) {
  	      if (op.insert != null) {
  	        return typeof op.insert === 'string' ? op.insert : NULL_CHARACTER;
  	      }
  	      var prep = (delta === other) ? 'on' : 'with';
  	      throw new Error('diff() called ' + prep + ' non-document');
  	    }).join('');
  	  });
  	  var delta = new Delta();
  	  var diffResult = diff(strings[0], strings[1], index);
  	  var thisIter = op.iterator(this.ops);
  	  var otherIter = op.iterator(other.ops);
  	  diffResult.forEach(function (component) {
  	    var length = component[1].length;
  	    while (length > 0) {
  	      var opLength = 0;
  	      switch (component[0]) {
  	        case diff.INSERT:
  	          opLength = Math.min(otherIter.peekLength(), length);
  	          delta.push(otherIter.next(opLength));
  	          break;
  	        case diff.DELETE:
  	          opLength = Math.min(length, thisIter.peekLength());
  	          thisIter.next(opLength);
  	          delta['delete'](opLength);
  	          break;
  	        case diff.EQUAL:
  	          opLength = Math.min(thisIter.peekLength(), otherIter.peekLength(), length);
  	          var thisOp = thisIter.next(opLength);
  	          var otherOp = otherIter.next(opLength);
  	          if (equal(thisOp.insert, otherOp.insert)) {
  	            delta.retain(opLength, op.attributes.diff(thisOp.attributes, otherOp.attributes));
  	          } else {
  	            delta.push(otherOp)['delete'](opLength);
  	          }
  	          break;
  	      }
  	      length -= opLength;
  	    }
  	  });
  	  return delta.chop();
  	};

  	Delta.prototype.eachLine = function (predicate, newline) {
  	  newline = newline || '\n';
  	  var iter = op.iterator(this.ops);
  	  var line = new Delta();
  	  var i = 0;
  	  while (iter.hasNext()) {
  	    if (iter.peekType() !== 'insert') return;
  	    var thisOp = iter.peek();
  	    var start = op.length(thisOp) - iter.peekLength();
  	    var index = typeof thisOp.insert === 'string' ?
  	      thisOp.insert.indexOf(newline, start) - start : -1;
  	    if (index < 0) {
  	      line.push(iter.next());
  	    } else if (index > 0) {
  	      line.push(iter.next(index));
  	    } else {
  	      if (predicate(line, iter.next(1).attributes || {}, i) === false) {
  	        return;
  	      }
  	      i += 1;
  	      line = new Delta();
  	    }
  	  }
  	  if (line.length() > 0) {
  	    predicate(line, {}, i);
  	  }
  	};

  	Delta.prototype.transform = function (other, priority) {
  	  priority = !!priority;
  	  if (typeof other === 'number') {
  	    return this.transformPosition(other, priority);
  	  }
  	  var thisIter = op.iterator(this.ops);
  	  var otherIter = op.iterator(other.ops);
  	  var delta = new Delta();
  	  while (thisIter.hasNext() || otherIter.hasNext()) {
  	    if (thisIter.peekType() === 'insert' && (priority || otherIter.peekType() !== 'insert')) {
  	      delta.retain(op.length(thisIter.next()));
  	    } else if (otherIter.peekType() === 'insert') {
  	      delta.push(otherIter.next());
  	    } else {
  	      var length = Math.min(thisIter.peekLength(), otherIter.peekLength());
  	      var thisOp = thisIter.next(length);
  	      var otherOp = otherIter.next(length);
  	      if (thisOp['delete']) {
  	        // Our delete either makes their delete redundant or removes their retain
  	        continue;
  	      } else if (otherOp['delete']) {
  	        delta.push(otherOp);
  	      } else {
  	        // We retain either their retain or insert
  	        delta.retain(length, op.attributes.transform(thisOp.attributes, otherOp.attributes, priority));
  	      }
  	    }
  	  }
  	  return delta.chop();
  	};

  	Delta.prototype.transformPosition = function (index, priority) {
  	  priority = !!priority;
  	  var thisIter = op.iterator(this.ops);
  	  var offset = 0;
  	  while (thisIter.hasNext() && offset <= index) {
  	    var length = thisIter.peekLength();
  	    var nextType = thisIter.peekType();
  	    thisIter.next();
  	    if (nextType === 'delete') {
  	      index -= Math.min(length, index - offset);
  	      continue;
  	    } else if (nextType === 'insert' && (offset < index || !priority)) {
  	      index += length;
  	    }
  	    offset += length;
  	  }
  	  return index;
  	};


  	module.exports = Delta;


  	/***/ }),
  	/* 3 */
  	/***/ (function(module, exports) {

  	var hasOwn = Object.prototype.hasOwnProperty;
  	var toStr = Object.prototype.toString;
  	var defineProperty = Object.defineProperty;
  	var gOPD = Object.getOwnPropertyDescriptor;

  	var isArray = function isArray(arr) {
  		if (typeof Array.isArray === 'function') {
  			return Array.isArray(arr);
  		}

  		return toStr.call(arr) === '[object Array]';
  	};

  	var isPlainObject = function isPlainObject(obj) {
  		if (!obj || toStr.call(obj) !== '[object Object]') {
  			return false;
  		}

  		var hasOwnConstructor = hasOwn.call(obj, 'constructor');
  		var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
  		// Not own constructor property must be Object
  		if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
  			return false;
  		}

  		// Own properties are enumerated firstly, so to speed up,
  		// if last one is own, then all properties are own.
  		var key;
  		for (key in obj) { /**/ }

  		return typeof key === 'undefined' || hasOwn.call(obj, key);
  	};

  	// If name is '__proto__', and Object.defineProperty is available, define __proto__ as an own property on target
  	var setProperty = function setProperty(target, options) {
  		if (defineProperty && options.name === '__proto__') {
  			defineProperty(target, options.name, {
  				enumerable: true,
  				configurable: true,
  				value: options.newValue,
  				writable: true
  			});
  		} else {
  			target[options.name] = options.newValue;
  		}
  	};

  	// Return undefined instead of __proto__ if '__proto__' is not an own property
  	var getProperty = function getProperty(obj, name) {
  		if (name === '__proto__') {
  			if (!hasOwn.call(obj, name)) {
  				return void 0;
  			} else if (gOPD) {
  				// In early versions of node, obj['__proto__'] is buggy when obj has
  				// __proto__ as an own property. Object.getOwnPropertyDescriptor() works.
  				return gOPD(obj, name).value;
  			}
  		}

  		return obj[name];
  	};

  	module.exports = function extend() {
  		var options, name, src, copy, copyIsArray, clone;
  		var target = arguments[0];
  		var i = 1;
  		var length = arguments.length;
  		var deep = false;

  		// Handle a deep copy situation
  		if (typeof target === 'boolean') {
  			deep = target;
  			target = arguments[1] || {};
  			// skip the boolean and the target
  			i = 2;
  		}
  		if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
  			target = {};
  		}

  		for (; i < length; ++i) {
  			options = arguments[i];
  			// Only deal with non-null/undefined values
  			if (options != null) {
  				// Extend the base object
  				for (name in options) {
  					src = getProperty(target, name);
  					copy = getProperty(options, name);

  					// Prevent never-ending loop
  					if (target !== copy) {
  						// Recurse if we're merging plain objects or arrays
  						if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
  							if (copyIsArray) {
  								copyIsArray = false;
  								clone = src && isArray(src) ? src : [];
  							} else {
  								clone = src && isPlainObject(src) ? src : {};
  							}

  							// Never move original objects, clone them
  							setProperty(target, { name: name, newValue: extend(deep, clone, copy) });

  						// Don't bring in undefined values
  						} else if (typeof copy !== 'undefined') {
  							setProperty(target, { name: name, newValue: copy });
  						}
  					}
  				}
  			}
  		}

  		// Return the modified object
  		return target;
  	};


  	/***/ }),
  	/* 4 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.default = exports.BlockEmbed = exports.bubbleFormats = undefined;

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _extend = __webpack_require__(3);

  	var _extend2 = _interopRequireDefault(_extend);

  	var _quillDelta = __webpack_require__(2);

  	var _quillDelta2 = _interopRequireDefault(_quillDelta);

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _break = __webpack_require__(16);

  	var _break2 = _interopRequireDefault(_break);

  	var _inline = __webpack_require__(6);

  	var _inline2 = _interopRequireDefault(_inline);

  	var _text = __webpack_require__(7);

  	var _text2 = _interopRequireDefault(_text);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var NEWLINE_LENGTH = 1;

  	var BlockEmbed = function (_Parchment$Embed) {
  	  _inherits(BlockEmbed, _Parchment$Embed);

  	  function BlockEmbed() {
  	    _classCallCheck(this, BlockEmbed);

  	    return _possibleConstructorReturn(this, (BlockEmbed.__proto__ || Object.getPrototypeOf(BlockEmbed)).apply(this, arguments));
  	  }

  	  _createClass(BlockEmbed, [{
  	    key: 'attach',
  	    value: function attach() {
  	      _get(BlockEmbed.prototype.__proto__ || Object.getPrototypeOf(BlockEmbed.prototype), 'attach', this).call(this);
  	      this.attributes = new _parchment2.default.Attributor.Store(this.domNode);
  	    }
  	  }, {
  	    key: 'delta',
  	    value: function delta() {
  	      return new _quillDelta2.default().insert(this.value(), (0, _extend2.default)(this.formats(), this.attributes.values()));
  	    }
  	  }, {
  	    key: 'format',
  	    value: function format(name, value) {
  	      var attribute = _parchment2.default.query(name, _parchment2.default.Scope.BLOCK_ATTRIBUTE);
  	      if (attribute != null) {
  	        this.attributes.attribute(attribute, value);
  	      }
  	    }
  	  }, {
  	    key: 'formatAt',
  	    value: function formatAt(index, length, name, value) {
  	      this.format(name, value);
  	    }
  	  }, {
  	    key: 'insertAt',
  	    value: function insertAt(index, value, def) {
  	      if (typeof value === 'string' && value.endsWith('\n')) {
  	        var block = _parchment2.default.create(Block.blotName);
  	        this.parent.insertBefore(block, index === 0 ? this : this.next);
  	        block.insertAt(0, value.slice(0, -1));
  	      } else {
  	        _get(BlockEmbed.prototype.__proto__ || Object.getPrototypeOf(BlockEmbed.prototype), 'insertAt', this).call(this, index, value, def);
  	      }
  	    }
  	  }]);

  	  return BlockEmbed;
  	}(_parchment2.default.Embed);

  	BlockEmbed.scope = _parchment2.default.Scope.BLOCK_BLOT;
  	// It is important for cursor behavior BlockEmbeds use tags that are block level elements


  	var Block = function (_Parchment$Block) {
  	  _inherits(Block, _Parchment$Block);

  	  function Block(domNode) {
  	    _classCallCheck(this, Block);

  	    var _this2 = _possibleConstructorReturn(this, (Block.__proto__ || Object.getPrototypeOf(Block)).call(this, domNode));

  	    _this2.cache = {};
  	    return _this2;
  	  }

  	  _createClass(Block, [{
  	    key: 'delta',
  	    value: function delta() {
  	      if (this.cache.delta == null) {
  	        this.cache.delta = this.descendants(_parchment2.default.Leaf).reduce(function (delta, leaf) {
  	          if (leaf.length() === 0) {
  	            return delta;
  	          } else {
  	            return delta.insert(leaf.value(), bubbleFormats(leaf));
  	          }
  	        }, new _quillDelta2.default()).insert('\n', bubbleFormats(this));
  	      }
  	      return this.cache.delta;
  	    }
  	  }, {
  	    key: 'deleteAt',
  	    value: function deleteAt(index, length) {
  	      _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'deleteAt', this).call(this, index, length);
  	      this.cache = {};
  	    }
  	  }, {
  	    key: 'formatAt',
  	    value: function formatAt(index, length, name, value) {
  	      if (length <= 0) return;
  	      if (_parchment2.default.query(name, _parchment2.default.Scope.BLOCK)) {
  	        if (index + length === this.length()) {
  	          this.format(name, value);
  	        }
  	      } else {
  	        _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'formatAt', this).call(this, index, Math.min(length, this.length() - index - 1), name, value);
  	      }
  	      this.cache = {};
  	    }
  	  }, {
  	    key: 'insertAt',
  	    value: function insertAt(index, value, def) {
  	      if (def != null) return _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'insertAt', this).call(this, index, value, def);
  	      if (value.length === 0) return;
  	      var lines = value.split('\n');
  	      var text = lines.shift();
  	      if (text.length > 0) {
  	        if (index < this.length() - 1 || this.children.tail == null) {
  	          _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'insertAt', this).call(this, Math.min(index, this.length() - 1), text);
  	        } else {
  	          this.children.tail.insertAt(this.children.tail.length(), text);
  	        }
  	        this.cache = {};
  	      }
  	      var block = this;
  	      lines.reduce(function (index, line) {
  	        block = block.split(index, true);
  	        block.insertAt(0, line);
  	        return line.length;
  	      }, index + text.length);
  	    }
  	  }, {
  	    key: 'insertBefore',
  	    value: function insertBefore(blot, ref) {
  	      var head = this.children.head;
  	      _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'insertBefore', this).call(this, blot, ref);
  	      if (head instanceof _break2.default) {
  	        head.remove();
  	      }
  	      this.cache = {};
  	    }
  	  }, {
  	    key: 'length',
  	    value: function length() {
  	      if (this.cache.length == null) {
  	        this.cache.length = _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'length', this).call(this) + NEWLINE_LENGTH;
  	      }
  	      return this.cache.length;
  	    }
  	  }, {
  	    key: 'moveChildren',
  	    value: function moveChildren(target, ref) {
  	      _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'moveChildren', this).call(this, target, ref);
  	      this.cache = {};
  	    }
  	  }, {
  	    key: 'optimize',
  	    value: function optimize(context) {
  	      _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'optimize', this).call(this, context);
  	      this.cache = {};
  	    }
  	  }, {
  	    key: 'path',
  	    value: function path(index) {
  	      return _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'path', this).call(this, index, true);
  	    }
  	  }, {
  	    key: 'removeChild',
  	    value: function removeChild(child) {
  	      _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'removeChild', this).call(this, child);
  	      this.cache = {};
  	    }
  	  }, {
  	    key: 'split',
  	    value: function split(index) {
  	      var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  	      if (force && (index === 0 || index >= this.length() - NEWLINE_LENGTH)) {
  	        var clone = this.clone();
  	        if (index === 0) {
  	          this.parent.insertBefore(clone, this);
  	          return this;
  	        } else {
  	          this.parent.insertBefore(clone, this.next);
  	          return clone;
  	        }
  	      } else {
  	        var next = _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'split', this).call(this, index, force);
  	        this.cache = {};
  	        return next;
  	      }
  	    }
  	  }]);

  	  return Block;
  	}(_parchment2.default.Block);

  	Block.blotName = 'block';
  	Block.tagName = 'P';
  	Block.defaultChild = 'break';
  	Block.allowedChildren = [_inline2.default, _parchment2.default.Embed, _text2.default];

  	function bubbleFormats(blot) {
  	  var formats = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  	  if (blot == null) return formats;
  	  if (typeof blot.formats === 'function') {
  	    formats = (0, _extend2.default)(formats, blot.formats());
  	  }
  	  if (blot.parent == null || blot.parent.blotName == 'scroll' || blot.parent.statics.scope !== blot.statics.scope) {
  	    return formats;
  	  }
  	  return bubbleFormats(blot.parent, formats);
  	}

  	exports.bubbleFormats = bubbleFormats;
  	exports.BlockEmbed = BlockEmbed;
  	exports.default = Block;

  	/***/ }),
  	/* 5 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.default = exports.overload = exports.expandConfig = undefined;

  	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	__webpack_require__(50);

  	var _quillDelta = __webpack_require__(2);

  	var _quillDelta2 = _interopRequireDefault(_quillDelta);

  	var _editor = __webpack_require__(14);

  	var _editor2 = _interopRequireDefault(_editor);

  	var _emitter3 = __webpack_require__(8);

  	var _emitter4 = _interopRequireDefault(_emitter3);

  	var _module = __webpack_require__(9);

  	var _module2 = _interopRequireDefault(_module);

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _selection = __webpack_require__(15);

  	var _selection2 = _interopRequireDefault(_selection);

  	var _extend = __webpack_require__(3);

  	var _extend2 = _interopRequireDefault(_extend);

  	var _logger = __webpack_require__(10);

  	var _logger2 = _interopRequireDefault(_logger);

  	var _theme = __webpack_require__(34);

  	var _theme2 = _interopRequireDefault(_theme);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	var debug = (0, _logger2.default)('quill');

  	var Quill = function () {
  	  _createClass(Quill, null, [{
  	    key: 'debug',
  	    value: function debug(limit) {
  	      if (limit === true) {
  	        limit = 'log';
  	      }
  	      _logger2.default.level(limit);
  	    }
  	  }, {
  	    key: 'find',
  	    value: function find(node) {
  	      return node.__quill || _parchment2.default.find(node);
  	    }
  	  }, {
  	    key: 'import',
  	    value: function _import(name) {
  	      if (this.imports[name] == null) {
  	        debug.error('Cannot import ' + name + '. Are you sure it was registered?');
  	      }
  	      return this.imports[name];
  	    }
  	  }, {
  	    key: 'register',
  	    value: function register(path, target) {
  	      var _this = this;

  	      var overwrite = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  	      if (typeof path !== 'string') {
  	        var name = path.attrName || path.blotName;
  	        if (typeof name === 'string') {
  	          // register(Blot | Attributor, overwrite)
  	          this.register('formats/' + name, path, target);
  	        } else {
  	          Object.keys(path).forEach(function (key) {
  	            _this.register(key, path[key], target);
  	          });
  	        }
  	      } else {
  	        if (this.imports[path] != null && !overwrite) {
  	          debug.warn('Overwriting ' + path + ' with', target);
  	        }
  	        this.imports[path] = target;
  	        if ((path.startsWith('blots/') || path.startsWith('formats/')) && target.blotName !== 'abstract') {
  	          _parchment2.default.register(target);
  	        } else if (path.startsWith('modules') && typeof target.register === 'function') {
  	          target.register();
  	        }
  	      }
  	    }
  	  }]);

  	  function Quill(container) {
  	    var _this2 = this;

  	    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  	    _classCallCheck(this, Quill);

  	    this.options = expandConfig(container, options);
  	    this.container = this.options.container;
  	    if (this.container == null) {
  	      return debug.error('Invalid Quill container', container);
  	    }
  	    if (this.options.debug) {
  	      Quill.debug(this.options.debug);
  	    }
  	    var html = this.container.innerHTML.trim();
  	    this.container.classList.add('ql-container');
  	    this.container.innerHTML = '';
  	    this.container.__quill = this;
  	    this.root = this.addContainer('ql-editor');
  	    this.root.classList.add('ql-blank');
  	    this.root.setAttribute('data-gramm', false);
  	    this.scrollingContainer = this.options.scrollingContainer || this.root;
  	    this.emitter = new _emitter4.default();
  	    this.scroll = _parchment2.default.create(this.root, {
  	      emitter: this.emitter,
  	      whitelist: this.options.formats
  	    });
  	    this.editor = new _editor2.default(this.scroll);
  	    this.selection = new _selection2.default(this.scroll, this.emitter);
  	    this.theme = new this.options.theme(this, this.options);
  	    this.keyboard = this.theme.addModule('keyboard');
  	    this.clipboard = this.theme.addModule('clipboard');
  	    this.history = this.theme.addModule('history');
  	    this.theme.init();
  	    this.emitter.on(_emitter4.default.events.EDITOR_CHANGE, function (type) {
  	      if (type === _emitter4.default.events.TEXT_CHANGE) {
  	        _this2.root.classList.toggle('ql-blank', _this2.editor.isBlank());
  	      }
  	    });
  	    this.emitter.on(_emitter4.default.events.SCROLL_UPDATE, function (source, mutations) {
  	      var range = _this2.selection.lastRange;
  	      var index = range && range.length === 0 ? range.index : undefined;
  	      modify.call(_this2, function () {
  	        return _this2.editor.update(null, mutations, index);
  	      }, source);
  	    });
  	    var contents = this.clipboard.convert('<div class=\'ql-editor\' style="white-space: normal;">' + html + '<p><br></p></div>');
  	    this.setContents(contents);
  	    this.history.clear();
  	    if (this.options.placeholder) {
  	      this.root.setAttribute('data-placeholder', this.options.placeholder);
  	    }
  	    if (this.options.readOnly) {
  	      this.disable();
  	    }
  	  }

  	  _createClass(Quill, [{
  	    key: 'addContainer',
  	    value: function addContainer(container) {
  	      var refNode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

  	      if (typeof container === 'string') {
  	        var className = container;
  	        container = document.createElement('div');
  	        container.classList.add(className);
  	      }
  	      this.container.insertBefore(container, refNode);
  	      return container;
  	    }
  	  }, {
  	    key: 'blur',
  	    value: function blur() {
  	      this.selection.setRange(null);
  	    }
  	  }, {
  	    key: 'deleteText',
  	    value: function deleteText(index, length, source) {
  	      var _this3 = this;

  	      var _overload = overload(index, length, source);

  	      var _overload2 = _slicedToArray(_overload, 4);

  	      index = _overload2[0];
  	      length = _overload2[1];
  	      source = _overload2[3];

  	      return modify.call(this, function () {
  	        return _this3.editor.deleteText(index, length);
  	      }, source, index, -1 * length);
  	    }
  	  }, {
  	    key: 'disable',
  	    value: function disable() {
  	      this.enable(false);
  	    }
  	  }, {
  	    key: 'enable',
  	    value: function enable() {
  	      var enabled = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

  	      this.scroll.enable(enabled);
  	      this.container.classList.toggle('ql-disabled', !enabled);
  	    }
  	  }, {
  	    key: 'focus',
  	    value: function focus() {
  	      var scrollTop = this.scrollingContainer.scrollTop;
  	      this.selection.focus();
  	      this.scrollingContainer.scrollTop = scrollTop;
  	      this.scrollIntoView();
  	    }
  	  }, {
  	    key: 'format',
  	    value: function format(name, value) {
  	      var _this4 = this;

  	      var source = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _emitter4.default.sources.API;

  	      return modify.call(this, function () {
  	        var range = _this4.getSelection(true);
  	        var change = new _quillDelta2.default();
  	        if (range == null) {
  	          return change;
  	        } else if (_parchment2.default.query(name, _parchment2.default.Scope.BLOCK)) {
  	          change = _this4.editor.formatLine(range.index, range.length, _defineProperty({}, name, value));
  	        } else if (range.length === 0) {
  	          _this4.selection.format(name, value);
  	          return change;
  	        } else {
  	          change = _this4.editor.formatText(range.index, range.length, _defineProperty({}, name, value));
  	        }
  	        _this4.setSelection(range, _emitter4.default.sources.SILENT);
  	        return change;
  	      }, source);
  	    }
  	  }, {
  	    key: 'formatLine',
  	    value: function formatLine(index, length, name, value, source) {
  	      var _this5 = this;

  	      var formats = void 0;

  	      var _overload3 = overload(index, length, name, value, source);

  	      var _overload4 = _slicedToArray(_overload3, 4);

  	      index = _overload4[0];
  	      length = _overload4[1];
  	      formats = _overload4[2];
  	      source = _overload4[3];

  	      return modify.call(this, function () {
  	        return _this5.editor.formatLine(index, length, formats);
  	      }, source, index, 0);
  	    }
  	  }, {
  	    key: 'formatText',
  	    value: function formatText(index, length, name, value, source) {
  	      var _this6 = this;

  	      var formats = void 0;

  	      var _overload5 = overload(index, length, name, value, source);

  	      var _overload6 = _slicedToArray(_overload5, 4);

  	      index = _overload6[0];
  	      length = _overload6[1];
  	      formats = _overload6[2];
  	      source = _overload6[3];

  	      return modify.call(this, function () {
  	        return _this6.editor.formatText(index, length, formats);
  	      }, source, index, 0);
  	    }
  	  }, {
  	    key: 'getBounds',
  	    value: function getBounds(index) {
  	      var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  	      var bounds = void 0;
  	      if (typeof index === 'number') {
  	        bounds = this.selection.getBounds(index, length);
  	      } else {
  	        bounds = this.selection.getBounds(index.index, index.length);
  	      }
  	      var containerBounds = this.container.getBoundingClientRect();
  	      return {
  	        bottom: bounds.bottom - containerBounds.top,
  	        height: bounds.height,
  	        left: bounds.left - containerBounds.left,
  	        right: bounds.right - containerBounds.left,
  	        top: bounds.top - containerBounds.top,
  	        width: bounds.width
  	      };
  	    }
  	  }, {
  	    key: 'getContents',
  	    value: function getContents() {
  	      var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  	      var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.getLength() - index;

  	      var _overload7 = overload(index, length);

  	      var _overload8 = _slicedToArray(_overload7, 2);

  	      index = _overload8[0];
  	      length = _overload8[1];

  	      return this.editor.getContents(index, length);
  	    }
  	  }, {
  	    key: 'getFormat',
  	    value: function getFormat() {
  	      var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.getSelection(true);
  	      var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  	      if (typeof index === 'number') {
  	        return this.editor.getFormat(index, length);
  	      } else {
  	        return this.editor.getFormat(index.index, index.length);
  	      }
  	    }
  	  }, {
  	    key: 'getIndex',
  	    value: function getIndex(blot) {
  	      return blot.offset(this.scroll);
  	    }
  	  }, {
  	    key: 'getLength',
  	    value: function getLength() {
  	      return this.scroll.length();
  	    }
  	  }, {
  	    key: 'getLeaf',
  	    value: function getLeaf(index) {
  	      return this.scroll.leaf(index);
  	    }
  	  }, {
  	    key: 'getLine',
  	    value: function getLine(index) {
  	      return this.scroll.line(index);
  	    }
  	  }, {
  	    key: 'getLines',
  	    value: function getLines() {
  	      var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  	      var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Number.MAX_VALUE;

  	      if (typeof index !== 'number') {
  	        return this.scroll.lines(index.index, index.length);
  	      } else {
  	        return this.scroll.lines(index, length);
  	      }
  	    }
  	  }, {
  	    key: 'getModule',
  	    value: function getModule(name) {
  	      return this.theme.modules[name];
  	    }
  	  }, {
  	    key: 'getSelection',
  	    value: function getSelection() {
  	      var focus = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

  	      if (focus) this.focus();
  	      this.update(); // Make sure we access getRange with editor in consistent state
  	      return this.selection.getRange()[0];
  	    }
  	  }, {
  	    key: 'getText',
  	    value: function getText() {
  	      var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  	      var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.getLength() - index;

  	      var _overload9 = overload(index, length);

  	      var _overload10 = _slicedToArray(_overload9, 2);

  	      index = _overload10[0];
  	      length = _overload10[1];

  	      return this.editor.getText(index, length);
  	    }
  	  }, {
  	    key: 'hasFocus',
  	    value: function hasFocus() {
  	      return this.selection.hasFocus();
  	    }
  	  }, {
  	    key: 'insertEmbed',
  	    value: function insertEmbed(index, embed, value) {
  	      var _this7 = this;

  	      var source = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : Quill.sources.API;

  	      return modify.call(this, function () {
  	        return _this7.editor.insertEmbed(index, embed, value);
  	      }, source, index);
  	    }
  	  }, {
  	    key: 'insertText',
  	    value: function insertText(index, text, name, value, source) {
  	      var _this8 = this;

  	      var formats = void 0;

  	      var _overload11 = overload(index, 0, name, value, source);

  	      var _overload12 = _slicedToArray(_overload11, 4);

  	      index = _overload12[0];
  	      formats = _overload12[2];
  	      source = _overload12[3];

  	      return modify.call(this, function () {
  	        return _this8.editor.insertText(index, text, formats);
  	      }, source, index, text.length);
  	    }
  	  }, {
  	    key: 'isEnabled',
  	    value: function isEnabled() {
  	      return !this.container.classList.contains('ql-disabled');
  	    }
  	  }, {
  	    key: 'off',
  	    value: function off() {
  	      return this.emitter.off.apply(this.emitter, arguments);
  	    }
  	  }, {
  	    key: 'on',
  	    value: function on() {
  	      return this.emitter.on.apply(this.emitter, arguments);
  	    }
  	  }, {
  	    key: 'once',
  	    value: function once() {
  	      return this.emitter.once.apply(this.emitter, arguments);
  	    }
  	  }, {
  	    key: 'pasteHTML',
  	    value: function pasteHTML(index, html, source) {
  	      this.clipboard.dangerouslyPasteHTML(index, html, source);
  	    }
  	  }, {
  	    key: 'removeFormat',
  	    value: function removeFormat(index, length, source) {
  	      var _this9 = this;

  	      var _overload13 = overload(index, length, source);

  	      var _overload14 = _slicedToArray(_overload13, 4);

  	      index = _overload14[0];
  	      length = _overload14[1];
  	      source = _overload14[3];

  	      return modify.call(this, function () {
  	        return _this9.editor.removeFormat(index, length);
  	      }, source, index);
  	    }
  	  }, {
  	    key: 'scrollIntoView',
  	    value: function scrollIntoView() {
  	      this.selection.scrollIntoView(this.scrollingContainer);
  	    }
  	  }, {
  	    key: 'setContents',
  	    value: function setContents(delta) {
  	      var _this10 = this;

  	      var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _emitter4.default.sources.API;

  	      return modify.call(this, function () {
  	        delta = new _quillDelta2.default(delta);
  	        var length = _this10.getLength();
  	        var deleted = _this10.editor.deleteText(0, length);
  	        var applied = _this10.editor.applyDelta(delta);
  	        var lastOp = applied.ops[applied.ops.length - 1];
  	        if (lastOp != null && typeof lastOp.insert === 'string' && lastOp.insert[lastOp.insert.length - 1] === '\n') {
  	          _this10.editor.deleteText(_this10.getLength() - 1, 1);
  	          applied.delete(1);
  	        }
  	        var ret = deleted.compose(applied);
  	        return ret;
  	      }, source);
  	    }
  	  }, {
  	    key: 'setSelection',
  	    value: function setSelection(index, length, source) {
  	      if (index == null) {
  	        this.selection.setRange(null, length || Quill.sources.API);
  	      } else {
  	        var _overload15 = overload(index, length, source);

  	        var _overload16 = _slicedToArray(_overload15, 4);

  	        index = _overload16[0];
  	        length = _overload16[1];
  	        source = _overload16[3];

  	        this.selection.setRange(new _selection.Range(index, length), source);
  	        if (source !== _emitter4.default.sources.SILENT) {
  	          this.selection.scrollIntoView(this.scrollingContainer);
  	        }
  	      }
  	    }
  	  }, {
  	    key: 'setText',
  	    value: function setText(text) {
  	      var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _emitter4.default.sources.API;

  	      var delta = new _quillDelta2.default().insert(text);
  	      return this.setContents(delta, source);
  	    }
  	  }, {
  	    key: 'update',
  	    value: function update() {
  	      var source = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _emitter4.default.sources.USER;

  	      var change = this.scroll.update(source); // Will update selection before selection.update() does if text changes
  	      this.selection.update(source);
  	      return change;
  	    }
  	  }, {
  	    key: 'updateContents',
  	    value: function updateContents(delta) {
  	      var _this11 = this;

  	      var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _emitter4.default.sources.API;

  	      return modify.call(this, function () {
  	        delta = new _quillDelta2.default(delta);
  	        return _this11.editor.applyDelta(delta, source);
  	      }, source, true);
  	    }
  	  }]);

  	  return Quill;
  	}();

  	Quill.DEFAULTS = {
  	  bounds: null,
  	  formats: null,
  	  modules: {},
  	  placeholder: '',
  	  readOnly: false,
  	  scrollingContainer: null,
  	  strict: true,
  	  theme: 'default'
  	};
  	Quill.events = _emitter4.default.events;
  	Quill.sources = _emitter4.default.sources;
  	// eslint-disable-next-line no-undef
  	Quill.version =  "1.3.7";

  	Quill.imports = {
  	  'delta': _quillDelta2.default,
  	  'parchment': _parchment2.default,
  	  'core/module': _module2.default,
  	  'core/theme': _theme2.default
  	};

  	function expandConfig(container, userConfig) {
  	  userConfig = (0, _extend2.default)(true, {
  	    container: container,
  	    modules: {
  	      clipboard: true,
  	      keyboard: true,
  	      history: true
  	    }
  	  }, userConfig);
  	  if (!userConfig.theme || userConfig.theme === Quill.DEFAULTS.theme) {
  	    userConfig.theme = _theme2.default;
  	  } else {
  	    userConfig.theme = Quill.import('themes/' + userConfig.theme);
  	    if (userConfig.theme == null) {
  	      throw new Error('Invalid theme ' + userConfig.theme + '. Did you register it?');
  	    }
  	  }
  	  var themeConfig = (0, _extend2.default)(true, {}, userConfig.theme.DEFAULTS);
  	  [themeConfig, userConfig].forEach(function (config) {
  	    config.modules = config.modules || {};
  	    Object.keys(config.modules).forEach(function (module) {
  	      if (config.modules[module] === true) {
  	        config.modules[module] = {};
  	      }
  	    });
  	  });
  	  var moduleNames = Object.keys(themeConfig.modules).concat(Object.keys(userConfig.modules));
  	  var moduleConfig = moduleNames.reduce(function (config, name) {
  	    var moduleClass = Quill.import('modules/' + name);
  	    if (moduleClass == null) {
  	      debug.error('Cannot load ' + name + ' module. Are you sure you registered it?');
  	    } else {
  	      config[name] = moduleClass.DEFAULTS || {};
  	    }
  	    return config;
  	  }, {});
  	  // Special case toolbar shorthand
  	  if (userConfig.modules != null && userConfig.modules.toolbar && userConfig.modules.toolbar.constructor !== Object) {
  	    userConfig.modules.toolbar = {
  	      container: userConfig.modules.toolbar
  	    };
  	  }
  	  userConfig = (0, _extend2.default)(true, {}, Quill.DEFAULTS, { modules: moduleConfig }, themeConfig, userConfig);
  	  ['bounds', 'container', 'scrollingContainer'].forEach(function (key) {
  	    if (typeof userConfig[key] === 'string') {
  	      userConfig[key] = document.querySelector(userConfig[key]);
  	    }
  	  });
  	  userConfig.modules = Object.keys(userConfig.modules).reduce(function (config, name) {
  	    if (userConfig.modules[name]) {
  	      config[name] = userConfig.modules[name];
  	    }
  	    return config;
  	  }, {});
  	  return userConfig;
  	}

  	// Handle selection preservation and TEXT_CHANGE emission
  	// common to modification APIs
  	function modify(modifier, source, index, shift) {
  	  if (this.options.strict && !this.isEnabled() && source === _emitter4.default.sources.USER) {
  	    return new _quillDelta2.default();
  	  }
  	  var range = index == null ? null : this.getSelection();
  	  var oldDelta = this.editor.delta;
  	  var change = modifier();
  	  if (range != null) {
  	    if (index === true) index = range.index;
  	    if (shift == null) {
  	      range = shiftRange(range, change, source);
  	    } else if (shift !== 0) {
  	      range = shiftRange(range, index, shift, source);
  	    }
  	    this.setSelection(range, _emitter4.default.sources.SILENT);
  	  }
  	  if (change.length() > 0) {
  	    var _emitter;

  	    var args = [_emitter4.default.events.TEXT_CHANGE, change, oldDelta, source];
  	    (_emitter = this.emitter).emit.apply(_emitter, [_emitter4.default.events.EDITOR_CHANGE].concat(args));
  	    if (source !== _emitter4.default.sources.SILENT) {
  	      var _emitter2;

  	      (_emitter2 = this.emitter).emit.apply(_emitter2, args);
  	    }
  	  }
  	  return change;
  	}

  	function overload(index, length, name, value, source) {
  	  var formats = {};
  	  if (typeof index.index === 'number' && typeof index.length === 'number') {
  	    // Allow for throwaway end (used by insertText/insertEmbed)
  	    if (typeof length !== 'number') {
  	      source = value, value = name, name = length, length = index.length, index = index.index;
  	    } else {
  	      length = index.length, index = index.index;
  	    }
  	  } else if (typeof length !== 'number') {
  	    source = value, value = name, name = length, length = 0;
  	  }
  	  // Handle format being object, two format name/value strings or excluded
  	  if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
  	    formats = name;
  	    source = value;
  	  } else if (typeof name === 'string') {
  	    if (value != null) {
  	      formats[name] = value;
  	    } else {
  	      source = name;
  	    }
  	  }
  	  // Handle optional source
  	  source = source || _emitter4.default.sources.API;
  	  return [index, length, formats, source];
  	}

  	function shiftRange(range, index, length, source) {
  	  if (range == null) return null;
  	  var start = void 0,
  	      end = void 0;
  	  if (index instanceof _quillDelta2.default) {
  	    var _map = [range.index, range.index + range.length].map(function (pos) {
  	      return index.transformPosition(pos, source !== _emitter4.default.sources.USER);
  	    });

  	    var _map2 = _slicedToArray(_map, 2);

  	    start = _map2[0];
  	    end = _map2[1];
  	  } else {
  	    var _map3 = [range.index, range.index + range.length].map(function (pos) {
  	      if (pos < index || pos === index && source === _emitter4.default.sources.USER) return pos;
  	      if (length >= 0) {
  	        return pos + length;
  	      } else {
  	        return Math.max(index, pos + length);
  	      }
  	    });

  	    var _map4 = _slicedToArray(_map3, 2);

  	    start = _map4[0];
  	    end = _map4[1];
  	  }
  	  return new _selection.Range(start, end - start);
  	}

  	exports.expandConfig = expandConfig;
  	exports.overload = overload;
  	exports.default = Quill;

  	/***/ }),
  	/* 6 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _text = __webpack_require__(7);

  	var _text2 = _interopRequireDefault(_text);

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var Inline = function (_Parchment$Inline) {
  	  _inherits(Inline, _Parchment$Inline);

  	  function Inline() {
  	    _classCallCheck(this, Inline);

  	    return _possibleConstructorReturn(this, (Inline.__proto__ || Object.getPrototypeOf(Inline)).apply(this, arguments));
  	  }

  	  _createClass(Inline, [{
  	    key: 'formatAt',
  	    value: function formatAt(index, length, name, value) {
  	      if (Inline.compare(this.statics.blotName, name) < 0 && _parchment2.default.query(name, _parchment2.default.Scope.BLOT)) {
  	        var blot = this.isolate(index, length);
  	        if (value) {
  	          blot.wrap(name, value);
  	        }
  	      } else {
  	        _get(Inline.prototype.__proto__ || Object.getPrototypeOf(Inline.prototype), 'formatAt', this).call(this, index, length, name, value);
  	      }
  	    }
  	  }, {
  	    key: 'optimize',
  	    value: function optimize(context) {
  	      _get(Inline.prototype.__proto__ || Object.getPrototypeOf(Inline.prototype), 'optimize', this).call(this, context);
  	      if (this.parent instanceof Inline && Inline.compare(this.statics.blotName, this.parent.statics.blotName) > 0) {
  	        var parent = this.parent.isolate(this.offset(), this.length());
  	        this.moveChildren(parent);
  	        parent.wrap(this);
  	      }
  	    }
  	  }], [{
  	    key: 'compare',
  	    value: function compare(self, other) {
  	      var selfIndex = Inline.order.indexOf(self);
  	      var otherIndex = Inline.order.indexOf(other);
  	      if (selfIndex >= 0 || otherIndex >= 0) {
  	        return selfIndex - otherIndex;
  	      } else if (self === other) {
  	        return 0;
  	      } else if (self < other) {
  	        return -1;
  	      } else {
  	        return 1;
  	      }
  	    }
  	  }]);

  	  return Inline;
  	}(_parchment2.default.Inline);

  	Inline.allowedChildren = [Inline, _parchment2.default.Embed, _text2.default];
  	// Lower index means deeper in the DOM tree, since not found (-1) is for embeds
  	Inline.order = ['cursor', 'inline', // Must be lower
  	'underline', 'strike', 'italic', 'bold', 'script', 'link', 'code' // Must be higher
  	];

  	exports.default = Inline;

  	/***/ }),
  	/* 7 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var TextBlot = function (_Parchment$Text) {
  	  _inherits(TextBlot, _Parchment$Text);

  	  function TextBlot() {
  	    _classCallCheck(this, TextBlot);

  	    return _possibleConstructorReturn(this, (TextBlot.__proto__ || Object.getPrototypeOf(TextBlot)).apply(this, arguments));
  	  }

  	  return TextBlot;
  	}(_parchment2.default.Text);

  	exports.default = TextBlot;

  	/***/ }),
  	/* 8 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _eventemitter = __webpack_require__(54);

  	var _eventemitter2 = _interopRequireDefault(_eventemitter);

  	var _logger = __webpack_require__(10);

  	var _logger2 = _interopRequireDefault(_logger);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var debug = (0, _logger2.default)('quill:events');

  	var EVENTS = ['selectionchange', 'mousedown', 'mouseup', 'click'];

  	EVENTS.forEach(function (eventName) {
  	  document.addEventListener(eventName, function () {
  	    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
  	      args[_key] = arguments[_key];
  	    }

  	    [].slice.call(document.querySelectorAll('.ql-container')).forEach(function (node) {
  	      // TODO use WeakMap
  	      if (node.__quill && node.__quill.emitter) {
  	        var _node$__quill$emitter;

  	        (_node$__quill$emitter = node.__quill.emitter).handleDOM.apply(_node$__quill$emitter, args);
  	      }
  	    });
  	  });
  	});

  	var Emitter = function (_EventEmitter) {
  	  _inherits(Emitter, _EventEmitter);

  	  function Emitter() {
  	    _classCallCheck(this, Emitter);

  	    var _this = _possibleConstructorReturn(this, (Emitter.__proto__ || Object.getPrototypeOf(Emitter)).call(this));

  	    _this.listeners = {};
  	    _this.on('error', debug.error);
  	    return _this;
  	  }

  	  _createClass(Emitter, [{
  	    key: 'emit',
  	    value: function emit() {
  	      debug.log.apply(debug, arguments);
  	      _get(Emitter.prototype.__proto__ || Object.getPrototypeOf(Emitter.prototype), 'emit', this).apply(this, arguments);
  	    }
  	  }, {
  	    key: 'handleDOM',
  	    value: function handleDOM(event) {
  	      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
  	        args[_key2 - 1] = arguments[_key2];
  	      }

  	      (this.listeners[event.type] || []).forEach(function (_ref) {
  	        var node = _ref.node,
  	            handler = _ref.handler;

  	        if (event.target === node || node.contains(event.target)) {
  	          handler.apply(undefined, [event].concat(args));
  	        }
  	      });
  	    }
  	  }, {
  	    key: 'listenDOM',
  	    value: function listenDOM(eventName, node, handler) {
  	      if (!this.listeners[eventName]) {
  	        this.listeners[eventName] = [];
  	      }
  	      this.listeners[eventName].push({ node: node, handler: handler });
  	    }
  	  }]);

  	  return Emitter;
  	}(_eventemitter2.default);

  	Emitter.events = {
  	  EDITOR_CHANGE: 'editor-change',
  	  SCROLL_BEFORE_UPDATE: 'scroll-before-update',
  	  SCROLL_OPTIMIZE: 'scroll-optimize',
  	  SCROLL_UPDATE: 'scroll-update',
  	  SELECTION_CHANGE: 'selection-change',
  	  TEXT_CHANGE: 'text-change'
  	};
  	Emitter.sources = {
  	  API: 'api',
  	  SILENT: 'silent',
  	  USER: 'user'
  	};

  	exports.default = Emitter;

  	/***/ }),
  	/* 9 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	var Module = function Module(quill) {
  	  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  	  _classCallCheck(this, Module);

  	  this.quill = quill;
  	  this.options = options;
  	};

  	Module.DEFAULTS = {};

  	exports.default = Module;

  	/***/ }),
  	/* 10 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	var levels = ['error', 'warn', 'log', 'info'];
  	var level = 'warn';

  	function debug(method) {
  	  if (levels.indexOf(method) <= levels.indexOf(level)) {
  	    var _console;

  	    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
  	      args[_key - 1] = arguments[_key];
  	    }

  	    (_console = console)[method].apply(_console, args); // eslint-disable-line no-console
  	  }
  	}

  	function namespace(ns) {
  	  return levels.reduce(function (logger, method) {
  	    logger[method] = debug.bind(console, method, ns);
  	    return logger;
  	  }, {});
  	}

  	debug.level = namespace.level = function (newLevel) {
  	  level = newLevel;
  	};

  	exports.default = namespace;

  	/***/ }),
  	/* 11 */
  	/***/ (function(module, exports, __webpack_require__) {

  	var pSlice = Array.prototype.slice;
  	var objectKeys = __webpack_require__(52);
  	var isArguments = __webpack_require__(53);

  	var deepEqual = module.exports = function (actual, expected, opts) {
  	  if (!opts) opts = {};
  	  // 7.1. All identical values are equivalent, as determined by ===.
  	  if (actual === expected) {
  	    return true;

  	  } else if (actual instanceof Date && expected instanceof Date) {
  	    return actual.getTime() === expected.getTime();

  	  // 7.3. Other pairs that do not both pass typeof value == 'object',
  	  // equivalence is determined by ==.
  	  } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
  	    return opts.strict ? actual === expected : actual == expected;

  	  // 7.4. For all other Object pairs, including Array objects, equivalence is
  	  // determined by having the same number of owned properties (as verified
  	  // with Object.prototype.hasOwnProperty.call), the same set of keys
  	  // (although not necessarily the same order), equivalent values for every
  	  // corresponding key, and an identical 'prototype' property. Note: this
  	  // accounts for both named and indexed properties on Arrays.
  	  } else {
  	    return objEquiv(actual, expected, opts);
  	  }
  	};

  	function isUndefinedOrNull(value) {
  	  return value === null || value === undefined;
  	}

  	function isBuffer (x) {
  	  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  	  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
  	    return false;
  	  }
  	  if (x.length > 0 && typeof x[0] !== 'number') return false;
  	  return true;
  	}

  	function objEquiv(a, b, opts) {
  	  var i, key;
  	  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
  	    return false;
  	  // an identical 'prototype' property.
  	  if (a.prototype !== b.prototype) return false;
  	  //~~~I've managed to break Object.keys through screwy arguments passing.
  	  //   Converting to array solves the problem.
  	  if (isArguments(a)) {
  	    if (!isArguments(b)) {
  	      return false;
  	    }
  	    a = pSlice.call(a);
  	    b = pSlice.call(b);
  	    return deepEqual(a, b, opts);
  	  }
  	  if (isBuffer(a)) {
  	    if (!isBuffer(b)) {
  	      return false;
  	    }
  	    if (a.length !== b.length) return false;
  	    for (i = 0; i < a.length; i++) {
  	      if (a[i] !== b[i]) return false;
  	    }
  	    return true;
  	  }
  	  try {
  	    var ka = objectKeys(a),
  	        kb = objectKeys(b);
  	  } catch (e) {//happens when one is a string literal and the other isn't
  	    return false;
  	  }
  	  // having the same number of owned properties (keys incorporates
  	  // hasOwnProperty)
  	  if (ka.length != kb.length)
  	    return false;
  	  //the same set of keys (although not necessarily the same order),
  	  ka.sort();
  	  kb.sort();
  	  //~~~cheap key test
  	  for (i = ka.length - 1; i >= 0; i--) {
  	    if (ka[i] != kb[i])
  	      return false;
  	  }
  	  //equivalent values for every corresponding key, and
  	  //~~~possibly expensive deep test
  	  for (i = ka.length - 1; i >= 0; i--) {
  	    key = ka[i];
  	    if (!deepEqual(a[key], b[key], opts)) return false;
  	  }
  	  return typeof a === typeof b;
  	}


  	/***/ }),
  	/* 12 */
  	/***/ (function(module, exports, __webpack_require__) {

  	Object.defineProperty(exports, "__esModule", { value: true });
  	var Registry = __webpack_require__(1);
  	var Attributor = /** @class */ (function () {
  	    function Attributor(attrName, keyName, options) {
  	        if (options === void 0) { options = {}; }
  	        this.attrName = attrName;
  	        this.keyName = keyName;
  	        var attributeBit = Registry.Scope.TYPE & Registry.Scope.ATTRIBUTE;
  	        if (options.scope != null) {
  	            // Ignore type bits, force attribute bit
  	            this.scope = (options.scope & Registry.Scope.LEVEL) | attributeBit;
  	        }
  	        else {
  	            this.scope = Registry.Scope.ATTRIBUTE;
  	        }
  	        if (options.whitelist != null)
  	            this.whitelist = options.whitelist;
  	    }
  	    Attributor.keys = function (node) {
  	        return [].map.call(node.attributes, function (item) {
  	            return item.name;
  	        });
  	    };
  	    Attributor.prototype.add = function (node, value) {
  	        if (!this.canAdd(node, value))
  	            return false;
  	        node.setAttribute(this.keyName, value);
  	        return true;
  	    };
  	    Attributor.prototype.canAdd = function (node, value) {
  	        var match = Registry.query(node, Registry.Scope.BLOT & (this.scope | Registry.Scope.TYPE));
  	        if (match == null)
  	            return false;
  	        if (this.whitelist == null)
  	            return true;
  	        if (typeof value === 'string') {
  	            return this.whitelist.indexOf(value.replace(/["']/g, '')) > -1;
  	        }
  	        else {
  	            return this.whitelist.indexOf(value) > -1;
  	        }
  	    };
  	    Attributor.prototype.remove = function (node) {
  	        node.removeAttribute(this.keyName);
  	    };
  	    Attributor.prototype.value = function (node) {
  	        var value = node.getAttribute(this.keyName);
  	        if (this.canAdd(node, value) && value) {
  	            return value;
  	        }
  	        return '';
  	    };
  	    return Attributor;
  	}());
  	exports.default = Attributor;


  	/***/ }),
  	/* 13 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.default = exports.Code = undefined;

  	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _quillDelta = __webpack_require__(2);

  	var _quillDelta2 = _interopRequireDefault(_quillDelta);

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _block = __webpack_require__(4);

  	var _block2 = _interopRequireDefault(_block);

  	var _inline = __webpack_require__(6);

  	var _inline2 = _interopRequireDefault(_inline);

  	var _text = __webpack_require__(7);

  	var _text2 = _interopRequireDefault(_text);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var Code = function (_Inline) {
  	  _inherits(Code, _Inline);

  	  function Code() {
  	    _classCallCheck(this, Code);

  	    return _possibleConstructorReturn(this, (Code.__proto__ || Object.getPrototypeOf(Code)).apply(this, arguments));
  	  }

  	  return Code;
  	}(_inline2.default);

  	Code.blotName = 'code';
  	Code.tagName = 'CODE';

  	var CodeBlock = function (_Block) {
  	  _inherits(CodeBlock, _Block);

  	  function CodeBlock() {
  	    _classCallCheck(this, CodeBlock);

  	    return _possibleConstructorReturn(this, (CodeBlock.__proto__ || Object.getPrototypeOf(CodeBlock)).apply(this, arguments));
  	  }

  	  _createClass(CodeBlock, [{
  	    key: 'delta',
  	    value: function delta() {
  	      var _this3 = this;

  	      var text = this.domNode.textContent;
  	      if (text.endsWith('\n')) {
  	        // Should always be true
  	        text = text.slice(0, -1);
  	      }
  	      return text.split('\n').reduce(function (delta, frag) {
  	        return delta.insert(frag).insert('\n', _this3.formats());
  	      }, new _quillDelta2.default());
  	    }
  	  }, {
  	    key: 'format',
  	    value: function format(name, value) {
  	      if (name === this.statics.blotName && value) return;

  	      var _descendant = this.descendant(_text2.default, this.length() - 1),
  	          _descendant2 = _slicedToArray(_descendant, 1),
  	          text = _descendant2[0];

  	      if (text != null) {
  	        text.deleteAt(text.length() - 1, 1);
  	      }
  	      _get(CodeBlock.prototype.__proto__ || Object.getPrototypeOf(CodeBlock.prototype), 'format', this).call(this, name, value);
  	    }
  	  }, {
  	    key: 'formatAt',
  	    value: function formatAt(index, length, name, value) {
  	      if (length === 0) return;
  	      if (_parchment2.default.query(name, _parchment2.default.Scope.BLOCK) == null || name === this.statics.blotName && value === this.statics.formats(this.domNode)) {
  	        return;
  	      }
  	      var nextNewline = this.newlineIndex(index);
  	      if (nextNewline < 0 || nextNewline >= index + length) return;
  	      var prevNewline = this.newlineIndex(index, true) + 1;
  	      var isolateLength = nextNewline - prevNewline + 1;
  	      var blot = this.isolate(prevNewline, isolateLength);
  	      var next = blot.next;
  	      blot.format(name, value);
  	      if (next instanceof CodeBlock) {
  	        next.formatAt(0, index - prevNewline + length - isolateLength, name, value);
  	      }
  	    }
  	  }, {
  	    key: 'insertAt',
  	    value: function insertAt(index, value, def) {
  	      if (def != null) return;

  	      var _descendant3 = this.descendant(_text2.default, index),
  	          _descendant4 = _slicedToArray(_descendant3, 2),
  	          text = _descendant4[0],
  	          offset = _descendant4[1];

  	      text.insertAt(offset, value);
  	    }
  	  }, {
  	    key: 'length',
  	    value: function length() {
  	      var length = this.domNode.textContent.length;
  	      if (!this.domNode.textContent.endsWith('\n')) {
  	        return length + 1;
  	      }
  	      return length;
  	    }
  	  }, {
  	    key: 'newlineIndex',
  	    value: function newlineIndex(searchIndex) {
  	      var reverse = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  	      if (!reverse) {
  	        var offset = this.domNode.textContent.slice(searchIndex).indexOf('\n');
  	        return offset > -1 ? searchIndex + offset : -1;
  	      } else {
  	        return this.domNode.textContent.slice(0, searchIndex).lastIndexOf('\n');
  	      }
  	    }
  	  }, {
  	    key: 'optimize',
  	    value: function optimize(context) {
  	      if (!this.domNode.textContent.endsWith('\n')) {
  	        this.appendChild(_parchment2.default.create('text', '\n'));
  	      }
  	      _get(CodeBlock.prototype.__proto__ || Object.getPrototypeOf(CodeBlock.prototype), 'optimize', this).call(this, context);
  	      var next = this.next;
  	      if (next != null && next.prev === this && next.statics.blotName === this.statics.blotName && this.statics.formats(this.domNode) === next.statics.formats(next.domNode)) {
  	        next.optimize(context);
  	        next.moveChildren(this);
  	        next.remove();
  	      }
  	    }
  	  }, {
  	    key: 'replace',
  	    value: function replace(target) {
  	      _get(CodeBlock.prototype.__proto__ || Object.getPrototypeOf(CodeBlock.prototype), 'replace', this).call(this, target);
  	      [].slice.call(this.domNode.querySelectorAll('*')).forEach(function (node) {
  	        var blot = _parchment2.default.find(node);
  	        if (blot == null) {
  	          node.parentNode.removeChild(node);
  	        } else if (blot instanceof _parchment2.default.Embed) {
  	          blot.remove();
  	        } else {
  	          blot.unwrap();
  	        }
  	      });
  	    }
  	  }], [{
  	    key: 'create',
  	    value: function create(value) {
  	      var domNode = _get(CodeBlock.__proto__ || Object.getPrototypeOf(CodeBlock), 'create', this).call(this, value);
  	      domNode.setAttribute('spellcheck', false);
  	      return domNode;
  	    }
  	  }, {
  	    key: 'formats',
  	    value: function formats() {
  	      return true;
  	    }
  	  }]);

  	  return CodeBlock;
  	}(_block2.default);

  	CodeBlock.blotName = 'code-block';
  	CodeBlock.tagName = 'PRE';
  	CodeBlock.TAB = '  ';

  	exports.Code = Code;
  	exports.default = CodeBlock;

  	/***/ }),
  	/* 14 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _quillDelta = __webpack_require__(2);

  	var _quillDelta2 = _interopRequireDefault(_quillDelta);

  	var _op = __webpack_require__(20);

  	var _op2 = _interopRequireDefault(_op);

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _code = __webpack_require__(13);

  	var _code2 = _interopRequireDefault(_code);

  	var _cursor = __webpack_require__(24);

  	var _cursor2 = _interopRequireDefault(_cursor);

  	var _block = __webpack_require__(4);

  	var _block2 = _interopRequireDefault(_block);

  	var _break = __webpack_require__(16);

  	var _break2 = _interopRequireDefault(_break);

  	var _clone = __webpack_require__(21);

  	var _clone2 = _interopRequireDefault(_clone);

  	var _deepEqual = __webpack_require__(11);

  	var _deepEqual2 = _interopRequireDefault(_deepEqual);

  	var _extend = __webpack_require__(3);

  	var _extend2 = _interopRequireDefault(_extend);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	var ASCII = /^[ -~]*$/;

  	var Editor = function () {
  	  function Editor(scroll) {
  	    _classCallCheck(this, Editor);

  	    this.scroll = scroll;
  	    this.delta = this.getDelta();
  	  }

  	  _createClass(Editor, [{
  	    key: 'applyDelta',
  	    value: function applyDelta(delta) {
  	      var _this = this;

  	      var consumeNextNewline = false;
  	      this.scroll.update();
  	      var scrollLength = this.scroll.length();
  	      this.scroll.batchStart();
  	      delta = normalizeDelta(delta);
  	      delta.reduce(function (index, op) {
  	        var length = op.retain || op.delete || op.insert.length || 1;
  	        var attributes = op.attributes || {};
  	        if (op.insert != null) {
  	          if (typeof op.insert === 'string') {
  	            var text = op.insert;
  	            if (text.endsWith('\n') && consumeNextNewline) {
  	              consumeNextNewline = false;
  	              text = text.slice(0, -1);
  	            }
  	            if (index >= scrollLength && !text.endsWith('\n')) {
  	              consumeNextNewline = true;
  	            }
  	            _this.scroll.insertAt(index, text);

  	            var _scroll$line = _this.scroll.line(index),
  	                _scroll$line2 = _slicedToArray(_scroll$line, 2),
  	                line = _scroll$line2[0],
  	                offset = _scroll$line2[1];

  	            var formats = (0, _extend2.default)({}, (0, _block.bubbleFormats)(line));
  	            if (line instanceof _block2.default) {
  	              var _line$descendant = line.descendant(_parchment2.default.Leaf, offset),
  	                  _line$descendant2 = _slicedToArray(_line$descendant, 1),
  	                  leaf = _line$descendant2[0];

  	              formats = (0, _extend2.default)(formats, (0, _block.bubbleFormats)(leaf));
  	            }
  	            attributes = _op2.default.attributes.diff(formats, attributes) || {};
  	          } else if (_typeof(op.insert) === 'object') {
  	            var key = Object.keys(op.insert)[0]; // There should only be one key
  	            if (key == null) return index;
  	            _this.scroll.insertAt(index, key, op.insert[key]);
  	          }
  	          scrollLength += length;
  	        }
  	        Object.keys(attributes).forEach(function (name) {
  	          _this.scroll.formatAt(index, length, name, attributes[name]);
  	        });
  	        return index + length;
  	      }, 0);
  	      delta.reduce(function (index, op) {
  	        if (typeof op.delete === 'number') {
  	          _this.scroll.deleteAt(index, op.delete);
  	          return index;
  	        }
  	        return index + (op.retain || op.insert.length || 1);
  	      }, 0);
  	      this.scroll.batchEnd();
  	      return this.update(delta);
  	    }
  	  }, {
  	    key: 'deleteText',
  	    value: function deleteText(index, length) {
  	      this.scroll.deleteAt(index, length);
  	      return this.update(new _quillDelta2.default().retain(index).delete(length));
  	    }
  	  }, {
  	    key: 'formatLine',
  	    value: function formatLine(index, length) {
  	      var _this2 = this;

  	      var formats = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  	      this.scroll.update();
  	      Object.keys(formats).forEach(function (format) {
  	        if (_this2.scroll.whitelist != null && !_this2.scroll.whitelist[format]) return;
  	        var lines = _this2.scroll.lines(index, Math.max(length, 1));
  	        var lengthRemaining = length;
  	        lines.forEach(function (line) {
  	          var lineLength = line.length();
  	          if (!(line instanceof _code2.default)) {
  	            line.format(format, formats[format]);
  	          } else {
  	            var codeIndex = index - line.offset(_this2.scroll);
  	            var codeLength = line.newlineIndex(codeIndex + lengthRemaining) - codeIndex + 1;
  	            line.formatAt(codeIndex, codeLength, format, formats[format]);
  	          }
  	          lengthRemaining -= lineLength;
  	        });
  	      });
  	      this.scroll.optimize();
  	      return this.update(new _quillDelta2.default().retain(index).retain(length, (0, _clone2.default)(formats)));
  	    }
  	  }, {
  	    key: 'formatText',
  	    value: function formatText(index, length) {
  	      var _this3 = this;

  	      var formats = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  	      Object.keys(formats).forEach(function (format) {
  	        _this3.scroll.formatAt(index, length, format, formats[format]);
  	      });
  	      return this.update(new _quillDelta2.default().retain(index).retain(length, (0, _clone2.default)(formats)));
  	    }
  	  }, {
  	    key: 'getContents',
  	    value: function getContents(index, length) {
  	      return this.delta.slice(index, index + length);
  	    }
  	  }, {
  	    key: 'getDelta',
  	    value: function getDelta() {
  	      return this.scroll.lines().reduce(function (delta, line) {
  	        return delta.concat(line.delta());
  	      }, new _quillDelta2.default());
  	    }
  	  }, {
  	    key: 'getFormat',
  	    value: function getFormat(index) {
  	      var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  	      var lines = [],
  	          leaves = [];
  	      if (length === 0) {
  	        this.scroll.path(index).forEach(function (path) {
  	          var _path = _slicedToArray(path, 1),
  	              blot = _path[0];

  	          if (blot instanceof _block2.default) {
  	            lines.push(blot);
  	          } else if (blot instanceof _parchment2.default.Leaf) {
  	            leaves.push(blot);
  	          }
  	        });
  	      } else {
  	        lines = this.scroll.lines(index, length);
  	        leaves = this.scroll.descendants(_parchment2.default.Leaf, index, length);
  	      }
  	      var formatsArr = [lines, leaves].map(function (blots) {
  	        if (blots.length === 0) return {};
  	        var formats = (0, _block.bubbleFormats)(blots.shift());
  	        while (Object.keys(formats).length > 0) {
  	          var blot = blots.shift();
  	          if (blot == null) return formats;
  	          formats = combineFormats((0, _block.bubbleFormats)(blot), formats);
  	        }
  	        return formats;
  	      });
  	      return _extend2.default.apply(_extend2.default, formatsArr);
  	    }
  	  }, {
  	    key: 'getText',
  	    value: function getText(index, length) {
  	      return this.getContents(index, length).filter(function (op) {
  	        return typeof op.insert === 'string';
  	      }).map(function (op) {
  	        return op.insert;
  	      }).join('');
  	    }
  	  }, {
  	    key: 'insertEmbed',
  	    value: function insertEmbed(index, embed, value) {
  	      this.scroll.insertAt(index, embed, value);
  	      return this.update(new _quillDelta2.default().retain(index).insert(_defineProperty({}, embed, value)));
  	    }
  	  }, {
  	    key: 'insertText',
  	    value: function insertText(index, text) {
  	      var _this4 = this;

  	      var formats = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  	      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  	      this.scroll.insertAt(index, text);
  	      Object.keys(formats).forEach(function (format) {
  	        _this4.scroll.formatAt(index, text.length, format, formats[format]);
  	      });
  	      return this.update(new _quillDelta2.default().retain(index).insert(text, (0, _clone2.default)(formats)));
  	    }
  	  }, {
  	    key: 'isBlank',
  	    value: function isBlank() {
  	      if (this.scroll.children.length == 0) return true;
  	      if (this.scroll.children.length > 1) return false;
  	      var block = this.scroll.children.head;
  	      if (block.statics.blotName !== _block2.default.blotName) return false;
  	      if (block.children.length > 1) return false;
  	      return block.children.head instanceof _break2.default;
  	    }
  	  }, {
  	    key: 'removeFormat',
  	    value: function removeFormat(index, length) {
  	      var text = this.getText(index, length);

  	      var _scroll$line3 = this.scroll.line(index + length),
  	          _scroll$line4 = _slicedToArray(_scroll$line3, 2),
  	          line = _scroll$line4[0],
  	          offset = _scroll$line4[1];

  	      var suffixLength = 0,
  	          suffix = new _quillDelta2.default();
  	      if (line != null) {
  	        if (!(line instanceof _code2.default)) {
  	          suffixLength = line.length() - offset;
  	        } else {
  	          suffixLength = line.newlineIndex(offset) - offset + 1;
  	        }
  	        suffix = line.delta().slice(offset, offset + suffixLength - 1).insert('\n');
  	      }
  	      var contents = this.getContents(index, length + suffixLength);
  	      var diff = contents.diff(new _quillDelta2.default().insert(text).concat(suffix));
  	      var delta = new _quillDelta2.default().retain(index).concat(diff);
  	      return this.applyDelta(delta);
  	    }
  	  }, {
  	    key: 'update',
  	    value: function update(change) {
  	      var mutations = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  	      var cursorIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

  	      var oldDelta = this.delta;
  	      if (mutations.length === 1 && mutations[0].type === 'characterData' && mutations[0].target.data.match(ASCII) && _parchment2.default.find(mutations[0].target)) {
  	        // Optimization for character changes
  	        var textBlot = _parchment2.default.find(mutations[0].target);
  	        var formats = (0, _block.bubbleFormats)(textBlot);
  	        var index = textBlot.offset(this.scroll);
  	        var oldValue = mutations[0].oldValue.replace(_cursor2.default.CONTENTS, '');
  	        var oldText = new _quillDelta2.default().insert(oldValue);
  	        var newText = new _quillDelta2.default().insert(textBlot.value());
  	        var diffDelta = new _quillDelta2.default().retain(index).concat(oldText.diff(newText, cursorIndex));
  	        change = diffDelta.reduce(function (delta, op) {
  	          if (op.insert) {
  	            return delta.insert(op.insert, formats);
  	          } else {
  	            return delta.push(op);
  	          }
  	        }, new _quillDelta2.default());
  	        this.delta = oldDelta.compose(change);
  	      } else {
  	        this.delta = this.getDelta();
  	        if (!change || !(0, _deepEqual2.default)(oldDelta.compose(change), this.delta)) {
  	          change = oldDelta.diff(this.delta, cursorIndex);
  	        }
  	      }
  	      return change;
  	    }
  	  }]);

  	  return Editor;
  	}();

  	function combineFormats(formats, combined) {
  	  return Object.keys(combined).reduce(function (merged, name) {
  	    if (formats[name] == null) return merged;
  	    if (combined[name] === formats[name]) {
  	      merged[name] = combined[name];
  	    } else if (Array.isArray(combined[name])) {
  	      if (combined[name].indexOf(formats[name]) < 0) {
  	        merged[name] = combined[name].concat([formats[name]]);
  	      }
  	    } else {
  	      merged[name] = [combined[name], formats[name]];
  	    }
  	    return merged;
  	  }, {});
  	}

  	function normalizeDelta(delta) {
  	  return delta.reduce(function (delta, op) {
  	    if (op.insert === 1) {
  	      var attributes = (0, _clone2.default)(op.attributes);
  	      delete attributes['image'];
  	      return delta.insert({ image: op.attributes.image }, attributes);
  	    }
  	    if (op.attributes != null && (op.attributes.list === true || op.attributes.bullet === true)) {
  	      op = (0, _clone2.default)(op);
  	      if (op.attributes.list) {
  	        op.attributes.list = 'ordered';
  	      } else {
  	        op.attributes.list = 'bullet';
  	        delete op.attributes.bullet;
  	      }
  	    }
  	    if (typeof op.insert === 'string') {
  	      var text = op.insert.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  	      return delta.insert(text, op.attributes);
  	    }
  	    return delta.push(op);
  	  }, new _quillDelta2.default());
  	}

  	exports.default = Editor;

  	/***/ }),
  	/* 15 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.default = exports.Range = undefined;

  	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _clone = __webpack_require__(21);

  	var _clone2 = _interopRequireDefault(_clone);

  	var _deepEqual = __webpack_require__(11);

  	var _deepEqual2 = _interopRequireDefault(_deepEqual);

  	var _emitter3 = __webpack_require__(8);

  	var _emitter4 = _interopRequireDefault(_emitter3);

  	var _logger = __webpack_require__(10);

  	var _logger2 = _interopRequireDefault(_logger);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	var debug = (0, _logger2.default)('quill:selection');

  	var Range = function Range(index) {
  	  var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  	  _classCallCheck(this, Range);

  	  this.index = index;
  	  this.length = length;
  	};

  	var Selection = function () {
  	  function Selection(scroll, emitter) {
  	    var _this = this;

  	    _classCallCheck(this, Selection);

  	    this.emitter = emitter;
  	    this.scroll = scroll;
  	    this.composing = false;
  	    this.mouseDown = false;
  	    this.root = this.scroll.domNode;
  	    this.cursor = _parchment2.default.create('cursor', this);
  	    // savedRange is last non-null range
  	    this.lastRange = this.savedRange = new Range(0, 0);
  	    this.handleComposition();
  	    this.handleDragging();
  	    this.emitter.listenDOM('selectionchange', document, function () {
  	      if (!_this.mouseDown) {
  	        setTimeout(_this.update.bind(_this, _emitter4.default.sources.USER), 1);
  	      }
  	    });
  	    this.emitter.on(_emitter4.default.events.EDITOR_CHANGE, function (type, delta) {
  	      if (type === _emitter4.default.events.TEXT_CHANGE && delta.length() > 0) {
  	        _this.update(_emitter4.default.sources.SILENT);
  	      }
  	    });
  	    this.emitter.on(_emitter4.default.events.SCROLL_BEFORE_UPDATE, function () {
  	      if (!_this.hasFocus()) return;
  	      var native = _this.getNativeRange();
  	      if (native == null) return;
  	      if (native.start.node === _this.cursor.textNode) return; // cursor.restore() will handle
  	      // TODO unclear if this has negative side effects
  	      _this.emitter.once(_emitter4.default.events.SCROLL_UPDATE, function () {
  	        try {
  	          _this.setNativeRange(native.start.node, native.start.offset, native.end.node, native.end.offset);
  	        } catch (ignored) {}
  	      });
  	    });
  	    this.emitter.on(_emitter4.default.events.SCROLL_OPTIMIZE, function (mutations, context) {
  	      if (context.range) {
  	        var _context$range = context.range,
  	            startNode = _context$range.startNode,
  	            startOffset = _context$range.startOffset,
  	            endNode = _context$range.endNode,
  	            endOffset = _context$range.endOffset;

  	        _this.setNativeRange(startNode, startOffset, endNode, endOffset);
  	      }
  	    });
  	    this.update(_emitter4.default.sources.SILENT);
  	  }

  	  _createClass(Selection, [{
  	    key: 'handleComposition',
  	    value: function handleComposition() {
  	      var _this2 = this;

  	      this.root.addEventListener('compositionstart', function () {
  	        _this2.composing = true;
  	      });
  	      this.root.addEventListener('compositionend', function () {
  	        _this2.composing = false;
  	        if (_this2.cursor.parent) {
  	          var range = _this2.cursor.restore();
  	          if (!range) return;
  	          setTimeout(function () {
  	            _this2.setNativeRange(range.startNode, range.startOffset, range.endNode, range.endOffset);
  	          }, 1);
  	        }
  	      });
  	    }
  	  }, {
  	    key: 'handleDragging',
  	    value: function handleDragging() {
  	      var _this3 = this;

  	      this.emitter.listenDOM('mousedown', document.body, function () {
  	        _this3.mouseDown = true;
  	      });
  	      this.emitter.listenDOM('mouseup', document.body, function () {
  	        _this3.mouseDown = false;
  	        _this3.update(_emitter4.default.sources.USER);
  	      });
  	    }
  	  }, {
  	    key: 'focus',
  	    value: function focus() {
  	      if (this.hasFocus()) return;
  	      this.root.focus();
  	      this.setRange(this.savedRange);
  	    }
  	  }, {
  	    key: 'format',
  	    value: function format(_format, value) {
  	      if (this.scroll.whitelist != null && !this.scroll.whitelist[_format]) return;
  	      this.scroll.update();
  	      var nativeRange = this.getNativeRange();
  	      if (nativeRange == null || !nativeRange.native.collapsed || _parchment2.default.query(_format, _parchment2.default.Scope.BLOCK)) return;
  	      if (nativeRange.start.node !== this.cursor.textNode) {
  	        var blot = _parchment2.default.find(nativeRange.start.node, false);
  	        if (blot == null) return;
  	        // TODO Give blot ability to not split
  	        if (blot instanceof _parchment2.default.Leaf) {
  	          var after = blot.split(nativeRange.start.offset);
  	          blot.parent.insertBefore(this.cursor, after);
  	        } else {
  	          blot.insertBefore(this.cursor, nativeRange.start.node); // Should never happen
  	        }
  	        this.cursor.attach();
  	      }
  	      this.cursor.format(_format, value);
  	      this.scroll.optimize();
  	      this.setNativeRange(this.cursor.textNode, this.cursor.textNode.data.length);
  	      this.update();
  	    }
  	  }, {
  	    key: 'getBounds',
  	    value: function getBounds(index) {
  	      var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  	      var scrollLength = this.scroll.length();
  	      index = Math.min(index, scrollLength - 1);
  	      length = Math.min(index + length, scrollLength - 1) - index;
  	      var node = void 0,
  	          _scroll$leaf = this.scroll.leaf(index),
  	          _scroll$leaf2 = _slicedToArray(_scroll$leaf, 2),
  	          leaf = _scroll$leaf2[0],
  	          offset = _scroll$leaf2[1];
  	      if (leaf == null) return null;

  	      var _leaf$position = leaf.position(offset, true);

  	      var _leaf$position2 = _slicedToArray(_leaf$position, 2);

  	      node = _leaf$position2[0];
  	      offset = _leaf$position2[1];

  	      var range = document.createRange();
  	      if (length > 0) {
  	        range.setStart(node, offset);

  	        var _scroll$leaf3 = this.scroll.leaf(index + length);

  	        var _scroll$leaf4 = _slicedToArray(_scroll$leaf3, 2);

  	        leaf = _scroll$leaf4[0];
  	        offset = _scroll$leaf4[1];

  	        if (leaf == null) return null;

  	        var _leaf$position3 = leaf.position(offset, true);

  	        var _leaf$position4 = _slicedToArray(_leaf$position3, 2);

  	        node = _leaf$position4[0];
  	        offset = _leaf$position4[1];

  	        range.setEnd(node, offset);
  	        return range.getBoundingClientRect();
  	      } else {
  	        var side = 'left';
  	        var rect = void 0;
  	        if (node instanceof Text) {
  	          if (offset < node.data.length) {
  	            range.setStart(node, offset);
  	            range.setEnd(node, offset + 1);
  	          } else {
  	            range.setStart(node, offset - 1);
  	            range.setEnd(node, offset);
  	            side = 'right';
  	          }
  	          rect = range.getBoundingClientRect();
  	        } else {
  	          rect = leaf.domNode.getBoundingClientRect();
  	          if (offset > 0) side = 'right';
  	        }
  	        return {
  	          bottom: rect.top + rect.height,
  	          height: rect.height,
  	          left: rect[side],
  	          right: rect[side],
  	          top: rect.top,
  	          width: 0
  	        };
  	      }
  	    }
  	  }, {
  	    key: 'getNativeRange',
  	    value: function getNativeRange() {
  	      var selection = document.getSelection();
  	      if (selection == null || selection.rangeCount <= 0) return null;
  	      var nativeRange = selection.getRangeAt(0);
  	      if (nativeRange == null) return null;
  	      var range = this.normalizeNative(nativeRange);
  	      debug.info('getNativeRange', range);
  	      return range;
  	    }
  	  }, {
  	    key: 'getRange',
  	    value: function getRange() {
  	      var normalized = this.getNativeRange();
  	      if (normalized == null) return [null, null];
  	      var range = this.normalizedToRange(normalized);
  	      return [range, normalized];
  	    }
  	  }, {
  	    key: 'hasFocus',
  	    value: function hasFocus() {
  	      return document.activeElement === this.root;
  	    }
  	  }, {
  	    key: 'normalizedToRange',
  	    value: function normalizedToRange(range) {
  	      var _this4 = this;

  	      var positions = [[range.start.node, range.start.offset]];
  	      if (!range.native.collapsed) {
  	        positions.push([range.end.node, range.end.offset]);
  	      }
  	      var indexes = positions.map(function (position) {
  	        var _position = _slicedToArray(position, 2),
  	            node = _position[0],
  	            offset = _position[1];

  	        var blot = _parchment2.default.find(node, true);
  	        var index = blot.offset(_this4.scroll);
  	        if (offset === 0) {
  	          return index;
  	        } else if (blot instanceof _parchment2.default.Container) {
  	          return index + blot.length();
  	        } else {
  	          return index + blot.index(node, offset);
  	        }
  	      });
  	      var end = Math.min(Math.max.apply(Math, _toConsumableArray(indexes)), this.scroll.length() - 1);
  	      var start = Math.min.apply(Math, [end].concat(_toConsumableArray(indexes)));
  	      return new Range(start, end - start);
  	    }
  	  }, {
  	    key: 'normalizeNative',
  	    value: function normalizeNative(nativeRange) {
  	      if (!contains(this.root, nativeRange.startContainer) || !nativeRange.collapsed && !contains(this.root, nativeRange.endContainer)) {
  	        return null;
  	      }
  	      var range = {
  	        start: { node: nativeRange.startContainer, offset: nativeRange.startOffset },
  	        end: { node: nativeRange.endContainer, offset: nativeRange.endOffset },
  	        native: nativeRange
  	      };
  	      [range.start, range.end].forEach(function (position) {
  	        var node = position.node,
  	            offset = position.offset;
  	        while (!(node instanceof Text) && node.childNodes.length > 0) {
  	          if (node.childNodes.length > offset) {
  	            node = node.childNodes[offset];
  	            offset = 0;
  	          } else if (node.childNodes.length === offset) {
  	            node = node.lastChild;
  	            offset = node instanceof Text ? node.data.length : node.childNodes.length + 1;
  	          } else {
  	            break;
  	          }
  	        }
  	        position.node = node, position.offset = offset;
  	      });
  	      return range;
  	    }
  	  }, {
  	    key: 'rangeToNative',
  	    value: function rangeToNative(range) {
  	      var _this5 = this;

  	      var indexes = range.collapsed ? [range.index] : [range.index, range.index + range.length];
  	      var args = [];
  	      var scrollLength = this.scroll.length();
  	      indexes.forEach(function (index, i) {
  	        index = Math.min(scrollLength - 1, index);
  	        var node = void 0,
  	            _scroll$leaf5 = _this5.scroll.leaf(index),
  	            _scroll$leaf6 = _slicedToArray(_scroll$leaf5, 2),
  	            leaf = _scroll$leaf6[0],
  	            offset = _scroll$leaf6[1];
  	        var _leaf$position5 = leaf.position(offset, i !== 0);

  	        var _leaf$position6 = _slicedToArray(_leaf$position5, 2);

  	        node = _leaf$position6[0];
  	        offset = _leaf$position6[1];

  	        args.push(node, offset);
  	      });
  	      if (args.length < 2) {
  	        args = args.concat(args);
  	      }
  	      return args;
  	    }
  	  }, {
  	    key: 'scrollIntoView',
  	    value: function scrollIntoView(scrollingContainer) {
  	      var range = this.lastRange;
  	      if (range == null) return;
  	      var bounds = this.getBounds(range.index, range.length);
  	      if (bounds == null) return;
  	      var limit = this.scroll.length() - 1;

  	      var _scroll$line = this.scroll.line(Math.min(range.index, limit)),
  	          _scroll$line2 = _slicedToArray(_scroll$line, 1),
  	          first = _scroll$line2[0];

  	      var last = first;
  	      if (range.length > 0) {
  	        var _scroll$line3 = this.scroll.line(Math.min(range.index + range.length, limit));

  	        var _scroll$line4 = _slicedToArray(_scroll$line3, 1);

  	        last = _scroll$line4[0];
  	      }
  	      if (first == null || last == null) return;
  	      var scrollBounds = scrollingContainer.getBoundingClientRect();
  	      if (bounds.top < scrollBounds.top) {
  	        scrollingContainer.scrollTop -= scrollBounds.top - bounds.top;
  	      } else if (bounds.bottom > scrollBounds.bottom) {
  	        scrollingContainer.scrollTop += bounds.bottom - scrollBounds.bottom;
  	      }
  	    }
  	  }, {
  	    key: 'setNativeRange',
  	    value: function setNativeRange(startNode, startOffset) {
  	      var endNode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : startNode;
  	      var endOffset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : startOffset;
  	      var force = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

  	      debug.info('setNativeRange', startNode, startOffset, endNode, endOffset);
  	      if (startNode != null && (this.root.parentNode == null || startNode.parentNode == null || endNode.parentNode == null)) {
  	        return;
  	      }
  	      var selection = document.getSelection();
  	      if (selection == null) return;
  	      if (startNode != null) {
  	        if (!this.hasFocus()) this.root.focus();
  	        var native = (this.getNativeRange() || {}).native;
  	        if (native == null || force || startNode !== native.startContainer || startOffset !== native.startOffset || endNode !== native.endContainer || endOffset !== native.endOffset) {

  	          if (startNode.tagName == "BR") {
  	            startOffset = [].indexOf.call(startNode.parentNode.childNodes, startNode);
  	            startNode = startNode.parentNode;
  	          }
  	          if (endNode.tagName == "BR") {
  	            endOffset = [].indexOf.call(endNode.parentNode.childNodes, endNode);
  	            endNode = endNode.parentNode;
  	          }
  	          var range = document.createRange();
  	          range.setStart(startNode, startOffset);
  	          range.setEnd(endNode, endOffset);
  	          selection.removeAllRanges();
  	          selection.addRange(range);
  	        }
  	      } else {
  	        selection.removeAllRanges();
  	        this.root.blur();
  	        document.body.focus(); // root.blur() not enough on IE11+Travis+SauceLabs (but not local VMs)
  	      }
  	    }
  	  }, {
  	    key: 'setRange',
  	    value: function setRange(range) {
  	      var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  	      var source = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _emitter4.default.sources.API;

  	      if (typeof force === 'string') {
  	        source = force;
  	        force = false;
  	      }
  	      debug.info('setRange', range);
  	      if (range != null) {
  	        var args = this.rangeToNative(range);
  	        this.setNativeRange.apply(this, _toConsumableArray(args).concat([force]));
  	      } else {
  	        this.setNativeRange(null);
  	      }
  	      this.update(source);
  	    }
  	  }, {
  	    key: 'update',
  	    value: function update() {
  	      var source = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _emitter4.default.sources.USER;

  	      var oldRange = this.lastRange;

  	      var _getRange = this.getRange(),
  	          _getRange2 = _slicedToArray(_getRange, 2),
  	          lastRange = _getRange2[0],
  	          nativeRange = _getRange2[1];

  	      this.lastRange = lastRange;
  	      if (this.lastRange != null) {
  	        this.savedRange = this.lastRange;
  	      }
  	      if (!(0, _deepEqual2.default)(oldRange, this.lastRange)) {
  	        var _emitter;

  	        if (!this.composing && nativeRange != null && nativeRange.native.collapsed && nativeRange.start.node !== this.cursor.textNode) {
  	          this.cursor.restore();
  	        }
  	        var args = [_emitter4.default.events.SELECTION_CHANGE, (0, _clone2.default)(this.lastRange), (0, _clone2.default)(oldRange), source];
  	        (_emitter = this.emitter).emit.apply(_emitter, [_emitter4.default.events.EDITOR_CHANGE].concat(args));
  	        if (source !== _emitter4.default.sources.SILENT) {
  	          var _emitter2;

  	          (_emitter2 = this.emitter).emit.apply(_emitter2, args);
  	        }
  	      }
  	    }
  	  }]);

  	  return Selection;
  	}();

  	function contains(parent, descendant) {
  	  try {
  	    // Firefox inserts inaccessible nodes around video elements
  	    descendant.parentNode;
  	  } catch (e) {
  	    return false;
  	  }
  	  // IE11 has bug with Text nodes
  	  // https://connect.microsoft.com/IE/feedback/details/780874/node-contains-is-incorrect
  	  if (descendant instanceof Text) {
  	    descendant = descendant.parentNode;
  	  }
  	  return parent.contains(descendant);
  	}

  	exports.Range = Range;
  	exports.default = Selection;

  	/***/ }),
  	/* 16 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var Break = function (_Parchment$Embed) {
  	  _inherits(Break, _Parchment$Embed);

  	  function Break() {
  	    _classCallCheck(this, Break);

  	    return _possibleConstructorReturn(this, (Break.__proto__ || Object.getPrototypeOf(Break)).apply(this, arguments));
  	  }

  	  _createClass(Break, [{
  	    key: 'insertInto',
  	    value: function insertInto(parent, ref) {
  	      if (parent.children.length === 0) {
  	        _get(Break.prototype.__proto__ || Object.getPrototypeOf(Break.prototype), 'insertInto', this).call(this, parent, ref);
  	      } else {
  	        this.remove();
  	      }
  	    }
  	  }, {
  	    key: 'length',
  	    value: function length() {
  	      return 0;
  	    }
  	  }, {
  	    key: 'value',
  	    value: function value() {
  	      return '';
  	    }
  	  }], [{
  	    key: 'value',
  	    value: function value() {
  	      return undefined;
  	    }
  	  }]);

  	  return Break;
  	}(_parchment2.default.Embed);

  	Break.blotName = 'break';
  	Break.tagName = 'BR';

  	exports.default = Break;

  	/***/ }),
  	/* 17 */
  	/***/ (function(module, exports, __webpack_require__) {

  	var __extends = (this && this.__extends) || (function () {
  	    var extendStatics = Object.setPrototypeOf ||
  	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
  	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
  	    return function (d, b) {
  	        extendStatics(d, b);
  	        function __() { this.constructor = d; }
  	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  	    };
  	})();
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var linked_list_1 = __webpack_require__(44);
  	var shadow_1 = __webpack_require__(30);
  	var Registry = __webpack_require__(1);
  	var ContainerBlot = /** @class */ (function (_super) {
  	    __extends(ContainerBlot, _super);
  	    function ContainerBlot(domNode) {
  	        var _this = _super.call(this, domNode) || this;
  	        _this.build();
  	        return _this;
  	    }
  	    ContainerBlot.prototype.appendChild = function (other) {
  	        this.insertBefore(other);
  	    };
  	    ContainerBlot.prototype.attach = function () {
  	        _super.prototype.attach.call(this);
  	        this.children.forEach(function (child) {
  	            child.attach();
  	        });
  	    };
  	    ContainerBlot.prototype.build = function () {
  	        var _this = this;
  	        this.children = new linked_list_1.default();
  	        // Need to be reversed for if DOM nodes already in order
  	        [].slice
  	            .call(this.domNode.childNodes)
  	            .reverse()
  	            .forEach(function (node) {
  	            try {
  	                var child = makeBlot(node);
  	                _this.insertBefore(child, _this.children.head || undefined);
  	            }
  	            catch (err) {
  	                if (err instanceof Registry.ParchmentError)
  	                    return;
  	                else
  	                    throw err;
  	            }
  	        });
  	    };
  	    ContainerBlot.prototype.deleteAt = function (index, length) {
  	        if (index === 0 && length === this.length()) {
  	            return this.remove();
  	        }
  	        this.children.forEachAt(index, length, function (child, offset, length) {
  	            child.deleteAt(offset, length);
  	        });
  	    };
  	    ContainerBlot.prototype.descendant = function (criteria, index) {
  	        var _a = this.children.find(index), child = _a[0], offset = _a[1];
  	        if ((criteria.blotName == null && criteria(child)) ||
  	            (criteria.blotName != null && child instanceof criteria)) {
  	            return [child, offset];
  	        }
  	        else if (child instanceof ContainerBlot) {
  	            return child.descendant(criteria, offset);
  	        }
  	        else {
  	            return [null, -1];
  	        }
  	    };
  	    ContainerBlot.prototype.descendants = function (criteria, index, length) {
  	        if (index === void 0) { index = 0; }
  	        if (length === void 0) { length = Number.MAX_VALUE; }
  	        var descendants = [];
  	        var lengthLeft = length;
  	        this.children.forEachAt(index, length, function (child, index, length) {
  	            if ((criteria.blotName == null && criteria(child)) ||
  	                (criteria.blotName != null && child instanceof criteria)) {
  	                descendants.push(child);
  	            }
  	            if (child instanceof ContainerBlot) {
  	                descendants = descendants.concat(child.descendants(criteria, index, lengthLeft));
  	            }
  	            lengthLeft -= length;
  	        });
  	        return descendants;
  	    };
  	    ContainerBlot.prototype.detach = function () {
  	        this.children.forEach(function (child) {
  	            child.detach();
  	        });
  	        _super.prototype.detach.call(this);
  	    };
  	    ContainerBlot.prototype.formatAt = function (index, length, name, value) {
  	        this.children.forEachAt(index, length, function (child, offset, length) {
  	            child.formatAt(offset, length, name, value);
  	        });
  	    };
  	    ContainerBlot.prototype.insertAt = function (index, value, def) {
  	        var _a = this.children.find(index), child = _a[0], offset = _a[1];
  	        if (child) {
  	            child.insertAt(offset, value, def);
  	        }
  	        else {
  	            var blot = def == null ? Registry.create('text', value) : Registry.create(value, def);
  	            this.appendChild(blot);
  	        }
  	    };
  	    ContainerBlot.prototype.insertBefore = function (childBlot, refBlot) {
  	        if (this.statics.allowedChildren != null &&
  	            !this.statics.allowedChildren.some(function (child) {
  	                return childBlot instanceof child;
  	            })) {
  	            throw new Registry.ParchmentError("Cannot insert " + childBlot.statics.blotName + " into " + this.statics.blotName);
  	        }
  	        childBlot.insertInto(this, refBlot);
  	    };
  	    ContainerBlot.prototype.length = function () {
  	        return this.children.reduce(function (memo, child) {
  	            return memo + child.length();
  	        }, 0);
  	    };
  	    ContainerBlot.prototype.moveChildren = function (targetParent, refNode) {
  	        this.children.forEach(function (child) {
  	            targetParent.insertBefore(child, refNode);
  	        });
  	    };
  	    ContainerBlot.prototype.optimize = function (context) {
  	        _super.prototype.optimize.call(this, context);
  	        if (this.children.length === 0) {
  	            if (this.statics.defaultChild != null) {
  	                var child = Registry.create(this.statics.defaultChild);
  	                this.appendChild(child);
  	                child.optimize(context);
  	            }
  	            else {
  	                this.remove();
  	            }
  	        }
  	    };
  	    ContainerBlot.prototype.path = function (index, inclusive) {
  	        if (inclusive === void 0) { inclusive = false; }
  	        var _a = this.children.find(index, inclusive), child = _a[0], offset = _a[1];
  	        var position = [[this, index]];
  	        if (child instanceof ContainerBlot) {
  	            return position.concat(child.path(offset, inclusive));
  	        }
  	        else if (child != null) {
  	            position.push([child, offset]);
  	        }
  	        return position;
  	    };
  	    ContainerBlot.prototype.removeChild = function (child) {
  	        this.children.remove(child);
  	    };
  	    ContainerBlot.prototype.replace = function (target) {
  	        if (target instanceof ContainerBlot) {
  	            target.moveChildren(this);
  	        }
  	        _super.prototype.replace.call(this, target);
  	    };
  	    ContainerBlot.prototype.split = function (index, force) {
  	        if (force === void 0) { force = false; }
  	        if (!force) {
  	            if (index === 0)
  	                return this;
  	            if (index === this.length())
  	                return this.next;
  	        }
  	        var after = this.clone();
  	        this.parent.insertBefore(after, this.next);
  	        this.children.forEachAt(index, this.length(), function (child, offset, length) {
  	            child = child.split(offset, force);
  	            after.appendChild(child);
  	        });
  	        return after;
  	    };
  	    ContainerBlot.prototype.unwrap = function () {
  	        this.moveChildren(this.parent, this.next);
  	        this.remove();
  	    };
  	    ContainerBlot.prototype.update = function (mutations, context) {
  	        var _this = this;
  	        var addedNodes = [];
  	        var removedNodes = [];
  	        mutations.forEach(function (mutation) {
  	            if (mutation.target === _this.domNode && mutation.type === 'childList') {
  	                addedNodes.push.apply(addedNodes, mutation.addedNodes);
  	                removedNodes.push.apply(removedNodes, mutation.removedNodes);
  	            }
  	        });
  	        removedNodes.forEach(function (node) {
  	            // Check node has actually been removed
  	            // One exception is Chrome does not immediately remove IFRAMEs
  	            // from DOM but MutationRecord is correct in its reported removal
  	            if (node.parentNode != null &&
  	                // @ts-ignore
  	                node.tagName !== 'IFRAME' &&
  	                document.body.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY) {
  	                return;
  	            }
  	            var blot = Registry.find(node);
  	            if (blot == null)
  	                return;
  	            if (blot.domNode.parentNode == null || blot.domNode.parentNode === _this.domNode) {
  	                blot.detach();
  	            }
  	        });
  	        addedNodes
  	            .filter(function (node) {
  	            return node.parentNode == _this.domNode;
  	        })
  	            .sort(function (a, b) {
  	            if (a === b)
  	                return 0;
  	            if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) {
  	                return 1;
  	            }
  	            return -1;
  	        })
  	            .forEach(function (node) {
  	            var refBlot = null;
  	            if (node.nextSibling != null) {
  	                refBlot = Registry.find(node.nextSibling);
  	            }
  	            var blot = makeBlot(node);
  	            if (blot.next != refBlot || blot.next == null) {
  	                if (blot.parent != null) {
  	                    blot.parent.removeChild(_this);
  	                }
  	                _this.insertBefore(blot, refBlot || undefined);
  	            }
  	        });
  	    };
  	    return ContainerBlot;
  	}(shadow_1.default));
  	function makeBlot(node) {
  	    var blot = Registry.find(node);
  	    if (blot == null) {
  	        try {
  	            blot = Registry.create(node);
  	        }
  	        catch (e) {
  	            blot = Registry.create(Registry.Scope.INLINE);
  	            [].slice.call(node.childNodes).forEach(function (child) {
  	                // @ts-ignore
  	                blot.domNode.appendChild(child);
  	            });
  	            if (node.parentNode) {
  	                node.parentNode.replaceChild(blot.domNode, node);
  	            }
  	            blot.attach();
  	        }
  	    }
  	    return blot;
  	}
  	exports.default = ContainerBlot;


  	/***/ }),
  	/* 18 */
  	/***/ (function(module, exports, __webpack_require__) {

  	var __extends = (this && this.__extends) || (function () {
  	    var extendStatics = Object.setPrototypeOf ||
  	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
  	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
  	    return function (d, b) {
  	        extendStatics(d, b);
  	        function __() { this.constructor = d; }
  	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  	    };
  	})();
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var attributor_1 = __webpack_require__(12);
  	var store_1 = __webpack_require__(31);
  	var container_1 = __webpack_require__(17);
  	var Registry = __webpack_require__(1);
  	var FormatBlot = /** @class */ (function (_super) {
  	    __extends(FormatBlot, _super);
  	    function FormatBlot(domNode) {
  	        var _this = _super.call(this, domNode) || this;
  	        _this.attributes = new store_1.default(_this.domNode);
  	        return _this;
  	    }
  	    FormatBlot.formats = function (domNode) {
  	        if (typeof this.tagName === 'string') {
  	            return true;
  	        }
  	        else if (Array.isArray(this.tagName)) {
  	            return domNode.tagName.toLowerCase();
  	        }
  	        return undefined;
  	    };
  	    FormatBlot.prototype.format = function (name, value) {
  	        var format = Registry.query(name);
  	        if (format instanceof attributor_1.default) {
  	            this.attributes.attribute(format, value);
  	        }
  	        else if (value) {
  	            if (format != null && (name !== this.statics.blotName || this.formats()[name] !== value)) {
  	                this.replaceWith(name, value);
  	            }
  	        }
  	    };
  	    FormatBlot.prototype.formats = function () {
  	        var formats = this.attributes.values();
  	        var format = this.statics.formats(this.domNode);
  	        if (format != null) {
  	            formats[this.statics.blotName] = format;
  	        }
  	        return formats;
  	    };
  	    FormatBlot.prototype.replaceWith = function (name, value) {
  	        var replacement = _super.prototype.replaceWith.call(this, name, value);
  	        this.attributes.copy(replacement);
  	        return replacement;
  	    };
  	    FormatBlot.prototype.update = function (mutations, context) {
  	        var _this = this;
  	        _super.prototype.update.call(this, mutations, context);
  	        if (mutations.some(function (mutation) {
  	            return mutation.target === _this.domNode && mutation.type === 'attributes';
  	        })) {
  	            this.attributes.build();
  	        }
  	    };
  	    FormatBlot.prototype.wrap = function (name, value) {
  	        var wrapper = _super.prototype.wrap.call(this, name, value);
  	        if (wrapper instanceof FormatBlot && wrapper.statics.scope === this.statics.scope) {
  	            this.attributes.move(wrapper);
  	        }
  	        return wrapper;
  	    };
  	    return FormatBlot;
  	}(container_1.default));
  	exports.default = FormatBlot;


  	/***/ }),
  	/* 19 */
  	/***/ (function(module, exports, __webpack_require__) {

  	var __extends = (this && this.__extends) || (function () {
  	    var extendStatics = Object.setPrototypeOf ||
  	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
  	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
  	    return function (d, b) {
  	        extendStatics(d, b);
  	        function __() { this.constructor = d; }
  	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  	    };
  	})();
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var shadow_1 = __webpack_require__(30);
  	var Registry = __webpack_require__(1);
  	var LeafBlot = /** @class */ (function (_super) {
  	    __extends(LeafBlot, _super);
  	    function LeafBlot() {
  	        return _super !== null && _super.apply(this, arguments) || this;
  	    }
  	    LeafBlot.value = function (domNode) {
  	        return true;
  	    };
  	    LeafBlot.prototype.index = function (node, offset) {
  	        if (this.domNode === node ||
  	            this.domNode.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY) {
  	            return Math.min(offset, 1);
  	        }
  	        return -1;
  	    };
  	    LeafBlot.prototype.position = function (index, inclusive) {
  	        var offset = [].indexOf.call(this.parent.domNode.childNodes, this.domNode);
  	        if (index > 0)
  	            offset += 1;
  	        return [this.parent.domNode, offset];
  	    };
  	    LeafBlot.prototype.value = function () {
  	        var _a;
  	        return _a = {}, _a[this.statics.blotName] = this.statics.value(this.domNode) || true, _a;
  	    };
  	    LeafBlot.scope = Registry.Scope.INLINE_BLOT;
  	    return LeafBlot;
  	}(shadow_1.default));
  	exports.default = LeafBlot;


  	/***/ }),
  	/* 20 */
  	/***/ (function(module, exports, __webpack_require__) {

  	var equal = __webpack_require__(11);
  	var extend = __webpack_require__(3);


  	var lib = {
  	  attributes: {
  	    compose: function (a, b, keepNull) {
  	      if (typeof a !== 'object') a = {};
  	      if (typeof b !== 'object') b = {};
  	      var attributes = extend(true, {}, b);
  	      if (!keepNull) {
  	        attributes = Object.keys(attributes).reduce(function (copy, key) {
  	          if (attributes[key] != null) {
  	            copy[key] = attributes[key];
  	          }
  	          return copy;
  	        }, {});
  	      }
  	      for (var key in a) {
  	        if (a[key] !== undefined && b[key] === undefined) {
  	          attributes[key] = a[key];
  	        }
  	      }
  	      return Object.keys(attributes).length > 0 ? attributes : undefined;
  	    },

  	    diff: function(a, b) {
  	      if (typeof a !== 'object') a = {};
  	      if (typeof b !== 'object') b = {};
  	      var attributes = Object.keys(a).concat(Object.keys(b)).reduce(function (attributes, key) {
  	        if (!equal(a[key], b[key])) {
  	          attributes[key] = b[key] === undefined ? null : b[key];
  	        }
  	        return attributes;
  	      }, {});
  	      return Object.keys(attributes).length > 0 ? attributes : undefined;
  	    },

  	    transform: function (a, b, priority) {
  	      if (typeof a !== 'object') return b;
  	      if (typeof b !== 'object') return undefined;
  	      if (!priority) return b;  // b simply overwrites us without priority
  	      var attributes = Object.keys(b).reduce(function (attributes, key) {
  	        if (a[key] === undefined) attributes[key] = b[key];  // null is a valid value
  	        return attributes;
  	      }, {});
  	      return Object.keys(attributes).length > 0 ? attributes : undefined;
  	    }
  	  },

  	  iterator: function (ops) {
  	    return new Iterator(ops);
  	  },

  	  length: function (op) {
  	    if (typeof op['delete'] === 'number') {
  	      return op['delete'];
  	    } else if (typeof op.retain === 'number') {
  	      return op.retain;
  	    } else {
  	      return typeof op.insert === 'string' ? op.insert.length : 1;
  	    }
  	  }
  	};


  	function Iterator(ops) {
  	  this.ops = ops;
  	  this.index = 0;
  	  this.offset = 0;
  	}
  	Iterator.prototype.hasNext = function () {
  	  return this.peekLength() < Infinity;
  	};

  	Iterator.prototype.next = function (length) {
  	  if (!length) length = Infinity;
  	  var nextOp = this.ops[this.index];
  	  if (nextOp) {
  	    var offset = this.offset;
  	    var opLength = lib.length(nextOp);
  	    if (length >= opLength - offset) {
  	      length = opLength - offset;
  	      this.index += 1;
  	      this.offset = 0;
  	    } else {
  	      this.offset += length;
  	    }
  	    if (typeof nextOp['delete'] === 'number') {
  	      return { 'delete': length };
  	    } else {
  	      var retOp = {};
  	      if (nextOp.attributes) {
  	        retOp.attributes = nextOp.attributes;
  	      }
  	      if (typeof nextOp.retain === 'number') {
  	        retOp.retain = length;
  	      } else if (typeof nextOp.insert === 'string') {
  	        retOp.insert = nextOp.insert.substr(offset, length);
  	      } else {
  	        // offset should === 0, length should === 1
  	        retOp.insert = nextOp.insert;
  	      }
  	      return retOp;
  	    }
  	  } else {
  	    return { retain: Infinity };
  	  }
  	};

  	Iterator.prototype.peek = function () {
  	  return this.ops[this.index];
  	};

  	Iterator.prototype.peekLength = function () {
  	  if (this.ops[this.index]) {
  	    // Should never return 0 if our index is being managed correctly
  	    return lib.length(this.ops[this.index]) - this.offset;
  	  } else {
  	    return Infinity;
  	  }
  	};

  	Iterator.prototype.peekType = function () {
  	  if (this.ops[this.index]) {
  	    if (typeof this.ops[this.index]['delete'] === 'number') {
  	      return 'delete';
  	    } else if (typeof this.ops[this.index].retain === 'number') {
  	      return 'retain';
  	    } else {
  	      return 'insert';
  	    }
  	  }
  	  return 'retain';
  	};

  	Iterator.prototype.rest = function () {
  	  if (!this.hasNext()) {
  	    return [];
  	  } else if (this.offset === 0) {
  	    return this.ops.slice(this.index);
  	  } else {
  	    var offset = this.offset;
  	    var index = this.index;
  	    var next = this.next();
  	    var rest = this.ops.slice(this.index);
  	    this.offset = offset;
  	    this.index = index;
  	    return [next].concat(rest);
  	  }
  	};


  	module.exports = lib;


  	/***/ }),
  	/* 21 */
  	/***/ (function(module, exports) {

  	var clone = (function() {

  	function _instanceof(obj, type) {
  	  return type != null && obj instanceof type;
  	}

  	var nativeMap;
  	try {
  	  nativeMap = Map;
  	} catch(_) {
  	  // maybe a reference error because no `Map`. Give it a dummy value that no
  	  // value will ever be an instanceof.
  	  nativeMap = function() {};
  	}

  	var nativeSet;
  	try {
  	  nativeSet = Set;
  	} catch(_) {
  	  nativeSet = function() {};
  	}

  	var nativePromise;
  	try {
  	  nativePromise = Promise;
  	} catch(_) {
  	  nativePromise = function() {};
  	}

  	/**
  	 * Clones (copies) an Object using deep copying.
  	 *
  	 * This function supports circular references by default, but if you are certain
  	 * there are no circular references in your object, you can save some CPU time
  	 * by calling clone(obj, false).
  	 *
  	 * Caution: if `circular` is false and `parent` contains circular references,
  	 * your program may enter an infinite loop and crash.
  	 *
  	 * @param `parent` - the object to be cloned
  	 * @param `circular` - set to true if the object to be cloned may contain
  	 *    circular references. (optional - true by default)
  	 * @param `depth` - set to a number if the object is only to be cloned to
  	 *    a particular depth. (optional - defaults to Infinity)
  	 * @param `prototype` - sets the prototype to be used when cloning an object.
  	 *    (optional - defaults to parent prototype).
  	 * @param `includeNonEnumerable` - set to true if the non-enumerable properties
  	 *    should be cloned as well. Non-enumerable properties on the prototype
  	 *    chain will be ignored. (optional - false by default)
  	*/
  	function clone(parent, circular, depth, prototype, includeNonEnumerable) {
  	  if (typeof circular === 'object') {
  	    depth = circular.depth;
  	    prototype = circular.prototype;
  	    includeNonEnumerable = circular.includeNonEnumerable;
  	    circular = circular.circular;
  	  }
  	  // maintain two arrays for circular references, where corresponding parents
  	  // and children have the same index
  	  var allParents = [];
  	  var allChildren = [];

  	  var useBuffer = typeof Buffer != 'undefined';

  	  if (typeof circular == 'undefined')
  	    circular = true;

  	  if (typeof depth == 'undefined')
  	    depth = Infinity;

  	  // recurse this function so we don't reset allParents and allChildren
  	  function _clone(parent, depth) {
  	    // cloning null always returns null
  	    if (parent === null)
  	      return null;

  	    if (depth === 0)
  	      return parent;

  	    var child;
  	    var proto;
  	    if (typeof parent != 'object') {
  	      return parent;
  	    }

  	    if (_instanceof(parent, nativeMap)) {
  	      child = new nativeMap();
  	    } else if (_instanceof(parent, nativeSet)) {
  	      child = new nativeSet();
  	    } else if (_instanceof(parent, nativePromise)) {
  	      child = new nativePromise(function (resolve, reject) {
  	        parent.then(function(value) {
  	          resolve(_clone(value, depth - 1));
  	        }, function(err) {
  	          reject(_clone(err, depth - 1));
  	        });
  	      });
  	    } else if (clone.__isArray(parent)) {
  	      child = [];
  	    } else if (clone.__isRegExp(parent)) {
  	      child = new RegExp(parent.source, __getRegExpFlags(parent));
  	      if (parent.lastIndex) child.lastIndex = parent.lastIndex;
  	    } else if (clone.__isDate(parent)) {
  	      child = new Date(parent.getTime());
  	    } else if (useBuffer && Buffer.isBuffer(parent)) {
  	      if (Buffer.allocUnsafe) {
  	        // Node.js >= 4.5.0
  	        child = Buffer.allocUnsafe(parent.length);
  	      } else {
  	        // Older Node.js versions
  	        child = new Buffer(parent.length);
  	      }
  	      parent.copy(child);
  	      return child;
  	    } else if (_instanceof(parent, Error)) {
  	      child = Object.create(parent);
  	    } else {
  	      if (typeof prototype == 'undefined') {
  	        proto = Object.getPrototypeOf(parent);
  	        child = Object.create(proto);
  	      }
  	      else {
  	        child = Object.create(prototype);
  	        proto = prototype;
  	      }
  	    }

  	    if (circular) {
  	      var index = allParents.indexOf(parent);

  	      if (index != -1) {
  	        return allChildren[index];
  	      }
  	      allParents.push(parent);
  	      allChildren.push(child);
  	    }

  	    if (_instanceof(parent, nativeMap)) {
  	      parent.forEach(function(value, key) {
  	        var keyChild = _clone(key, depth - 1);
  	        var valueChild = _clone(value, depth - 1);
  	        child.set(keyChild, valueChild);
  	      });
  	    }
  	    if (_instanceof(parent, nativeSet)) {
  	      parent.forEach(function(value) {
  	        var entryChild = _clone(value, depth - 1);
  	        child.add(entryChild);
  	      });
  	    }

  	    for (var i in parent) {
  	      var attrs;
  	      if (proto) {
  	        attrs = Object.getOwnPropertyDescriptor(proto, i);
  	      }

  	      if (attrs && attrs.set == null) {
  	        continue;
  	      }
  	      child[i] = _clone(parent[i], depth - 1);
  	    }

  	    if (Object.getOwnPropertySymbols) {
  	      var symbols = Object.getOwnPropertySymbols(parent);
  	      for (var i = 0; i < symbols.length; i++) {
  	        // Don't need to worry about cloning a symbol because it is a primitive,
  	        // like a number or string.
  	        var symbol = symbols[i];
  	        var descriptor = Object.getOwnPropertyDescriptor(parent, symbol);
  	        if (descriptor && !descriptor.enumerable && !includeNonEnumerable) {
  	          continue;
  	        }
  	        child[symbol] = _clone(parent[symbol], depth - 1);
  	        if (!descriptor.enumerable) {
  	          Object.defineProperty(child, symbol, {
  	            enumerable: false
  	          });
  	        }
  	      }
  	    }

  	    if (includeNonEnumerable) {
  	      var allPropertyNames = Object.getOwnPropertyNames(parent);
  	      for (var i = 0; i < allPropertyNames.length; i++) {
  	        var propertyName = allPropertyNames[i];
  	        var descriptor = Object.getOwnPropertyDescriptor(parent, propertyName);
  	        if (descriptor && descriptor.enumerable) {
  	          continue;
  	        }
  	        child[propertyName] = _clone(parent[propertyName], depth - 1);
  	        Object.defineProperty(child, propertyName, {
  	          enumerable: false
  	        });
  	      }
  	    }

  	    return child;
  	  }

  	  return _clone(parent, depth);
  	}

  	/**
  	 * Simple flat clone using prototype, accepts only objects, usefull for property
  	 * override on FLAT configuration object (no nested props).
  	 *
  	 * USE WITH CAUTION! This may not behave as you wish if you do not know how this
  	 * works.
  	 */
  	clone.clonePrototype = function clonePrototype(parent) {
  	  if (parent === null)
  	    return null;

  	  var c = function () {};
  	  c.prototype = parent;
  	  return new c();
  	};

  	// private utility functions

  	function __objToStr(o) {
  	  return Object.prototype.toString.call(o);
  	}
  	clone.__objToStr = __objToStr;

  	function __isDate(o) {
  	  return typeof o === 'object' && __objToStr(o) === '[object Date]';
  	}
  	clone.__isDate = __isDate;

  	function __isArray(o) {
  	  return typeof o === 'object' && __objToStr(o) === '[object Array]';
  	}
  	clone.__isArray = __isArray;

  	function __isRegExp(o) {
  	  return typeof o === 'object' && __objToStr(o) === '[object RegExp]';
  	}
  	clone.__isRegExp = __isRegExp;

  	function __getRegExpFlags(re) {
  	  var flags = '';
  	  if (re.global) flags += 'g';
  	  if (re.ignoreCase) flags += 'i';
  	  if (re.multiline) flags += 'm';
  	  return flags;
  	}
  	clone.__getRegExpFlags = __getRegExpFlags;

  	return clone;
  	})();

  	if (typeof module === 'object' && module.exports) {
  	  module.exports = clone;
  	}


  	/***/ }),
  	/* 22 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _emitter = __webpack_require__(8);

  	var _emitter2 = _interopRequireDefault(_emitter);

  	var _block = __webpack_require__(4);

  	var _block2 = _interopRequireDefault(_block);

  	var _break = __webpack_require__(16);

  	var _break2 = _interopRequireDefault(_break);

  	var _code = __webpack_require__(13);

  	var _code2 = _interopRequireDefault(_code);

  	var _container = __webpack_require__(25);

  	var _container2 = _interopRequireDefault(_container);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	function isLine(blot) {
  	  return blot instanceof _block2.default || blot instanceof _block.BlockEmbed;
  	}

  	var Scroll = function (_Parchment$Scroll) {
  	  _inherits(Scroll, _Parchment$Scroll);

  	  function Scroll(domNode, config) {
  	    _classCallCheck(this, Scroll);

  	    var _this = _possibleConstructorReturn(this, (Scroll.__proto__ || Object.getPrototypeOf(Scroll)).call(this, domNode));

  	    _this.emitter = config.emitter;
  	    if (Array.isArray(config.whitelist)) {
  	      _this.whitelist = config.whitelist.reduce(function (whitelist, format) {
  	        whitelist[format] = true;
  	        return whitelist;
  	      }, {});
  	    }
  	    // Some reason fixes composition issues with character languages in Windows/Chrome, Safari
  	    _this.domNode.addEventListener('DOMNodeInserted', function () {});
  	    _this.optimize();
  	    _this.enable();
  	    return _this;
  	  }

  	  _createClass(Scroll, [{
  	    key: 'batchStart',
  	    value: function batchStart() {
  	      this.batch = true;
  	    }
  	  }, {
  	    key: 'batchEnd',
  	    value: function batchEnd() {
  	      this.batch = false;
  	      this.optimize();
  	    }
  	  }, {
  	    key: 'deleteAt',
  	    value: function deleteAt(index, length) {
  	      var _line = this.line(index),
  	          _line2 = _slicedToArray(_line, 2),
  	          first = _line2[0],
  	          offset = _line2[1];

  	      var _line3 = this.line(index + length),
  	          _line4 = _slicedToArray(_line3, 1),
  	          last = _line4[0];

  	      _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'deleteAt', this).call(this, index, length);
  	      if (last != null && first !== last && offset > 0) {
  	        if (first instanceof _block.BlockEmbed || last instanceof _block.BlockEmbed) {
  	          this.optimize();
  	          return;
  	        }
  	        if (first instanceof _code2.default) {
  	          var newlineIndex = first.newlineIndex(first.length(), true);
  	          if (newlineIndex > -1) {
  	            first = first.split(newlineIndex + 1);
  	            if (first === last) {
  	              this.optimize();
  	              return;
  	            }
  	          }
  	        } else if (last instanceof _code2.default) {
  	          var _newlineIndex = last.newlineIndex(0);
  	          if (_newlineIndex > -1) {
  	            last.split(_newlineIndex + 1);
  	          }
  	        }
  	        var ref = last.children.head instanceof _break2.default ? null : last.children.head;
  	        first.moveChildren(last, ref);
  	        first.remove();
  	      }
  	      this.optimize();
  	    }
  	  }, {
  	    key: 'enable',
  	    value: function enable() {
  	      var enabled = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

  	      this.domNode.setAttribute('contenteditable', enabled);
  	    }
  	  }, {
  	    key: 'formatAt',
  	    value: function formatAt(index, length, format, value) {
  	      if (this.whitelist != null && !this.whitelist[format]) return;
  	      _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'formatAt', this).call(this, index, length, format, value);
  	      this.optimize();
  	    }
  	  }, {
  	    key: 'insertAt',
  	    value: function insertAt(index, value, def) {
  	      if (def != null && this.whitelist != null && !this.whitelist[value]) return;
  	      if (index >= this.length()) {
  	        if (def == null || _parchment2.default.query(value, _parchment2.default.Scope.BLOCK) == null) {
  	          var blot = _parchment2.default.create(this.statics.defaultChild);
  	          this.appendChild(blot);
  	          if (def == null && value.endsWith('\n')) {
  	            value = value.slice(0, -1);
  	          }
  	          blot.insertAt(0, value, def);
  	        } else {
  	          var embed = _parchment2.default.create(value, def);
  	          this.appendChild(embed);
  	        }
  	      } else {
  	        _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'insertAt', this).call(this, index, value, def);
  	      }
  	      this.optimize();
  	    }
  	  }, {
  	    key: 'insertBefore',
  	    value: function insertBefore(blot, ref) {
  	      if (blot.statics.scope === _parchment2.default.Scope.INLINE_BLOT) {
  	        var wrapper = _parchment2.default.create(this.statics.defaultChild);
  	        wrapper.appendChild(blot);
  	        blot = wrapper;
  	      }
  	      _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'insertBefore', this).call(this, blot, ref);
  	    }
  	  }, {
  	    key: 'leaf',
  	    value: function leaf(index) {
  	      return this.path(index).pop() || [null, -1];
  	    }
  	  }, {
  	    key: 'line',
  	    value: function line(index) {
  	      if (index === this.length()) {
  	        return this.line(index - 1);
  	      }
  	      return this.descendant(isLine, index);
  	    }
  	  }, {
  	    key: 'lines',
  	    value: function lines() {
  	      var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  	      var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Number.MAX_VALUE;

  	      var getLines = function getLines(blot, index, length) {
  	        var lines = [],
  	            lengthLeft = length;
  	        blot.children.forEachAt(index, length, function (child, index, length) {
  	          if (isLine(child)) {
  	            lines.push(child);
  	          } else if (child instanceof _parchment2.default.Container) {
  	            lines = lines.concat(getLines(child, index, lengthLeft));
  	          }
  	          lengthLeft -= length;
  	        });
  	        return lines;
  	      };
  	      return getLines(this, index, length);
  	    }
  	  }, {
  	    key: 'optimize',
  	    value: function optimize() {
  	      var mutations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  	      var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  	      if (this.batch === true) return;
  	      _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'optimize', this).call(this, mutations, context);
  	      if (mutations.length > 0) {
  	        this.emitter.emit(_emitter2.default.events.SCROLL_OPTIMIZE, mutations, context);
  	      }
  	    }
  	  }, {
  	    key: 'path',
  	    value: function path(index) {
  	      return _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'path', this).call(this, index).slice(1); // Exclude self
  	    }
  	  }, {
  	    key: 'update',
  	    value: function update(mutations) {
  	      if (this.batch === true) return;
  	      var source = _emitter2.default.sources.USER;
  	      if (typeof mutations === 'string') {
  	        source = mutations;
  	      }
  	      if (!Array.isArray(mutations)) {
  	        mutations = this.observer.takeRecords();
  	      }
  	      if (mutations.length > 0) {
  	        this.emitter.emit(_emitter2.default.events.SCROLL_BEFORE_UPDATE, source, mutations);
  	      }
  	      _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'update', this).call(this, mutations.concat([])); // pass copy
  	      if (mutations.length > 0) {
  	        this.emitter.emit(_emitter2.default.events.SCROLL_UPDATE, source, mutations);
  	      }
  	    }
  	  }]);

  	  return Scroll;
  	}(_parchment2.default.Scroll);

  	Scroll.blotName = 'scroll';
  	Scroll.className = 'ql-editor';
  	Scroll.tagName = 'DIV';
  	Scroll.defaultChild = 'block';
  	Scroll.allowedChildren = [_block2.default, _block.BlockEmbed, _container2.default];

  	exports.default = Scroll;

  	/***/ }),
  	/* 23 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.SHORTKEY = exports.default = undefined;

  	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _clone = __webpack_require__(21);

  	var _clone2 = _interopRequireDefault(_clone);

  	var _deepEqual = __webpack_require__(11);

  	var _deepEqual2 = _interopRequireDefault(_deepEqual);

  	var _extend = __webpack_require__(3);

  	var _extend2 = _interopRequireDefault(_extend);

  	var _quillDelta = __webpack_require__(2);

  	var _quillDelta2 = _interopRequireDefault(_quillDelta);

  	var _op = __webpack_require__(20);

  	var _op2 = _interopRequireDefault(_op);

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _quill = __webpack_require__(5);

  	var _quill2 = _interopRequireDefault(_quill);

  	var _logger = __webpack_require__(10);

  	var _logger2 = _interopRequireDefault(_logger);

  	var _module = __webpack_require__(9);

  	var _module2 = _interopRequireDefault(_module);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var debug = (0, _logger2.default)('quill:keyboard');

  	var SHORTKEY = /Mac/i.test(navigator.platform) ? 'metaKey' : 'ctrlKey';

  	var Keyboard = function (_Module) {
  	  _inherits(Keyboard, _Module);

  	  _createClass(Keyboard, null, [{
  	    key: 'match',
  	    value: function match(evt, binding) {
  	      binding = normalize(binding);
  	      if (['altKey', 'ctrlKey', 'metaKey', 'shiftKey'].some(function (key) {
  	        return !!binding[key] !== evt[key] && binding[key] !== null;
  	      })) {
  	        return false;
  	      }
  	      return binding.key === (evt.which || evt.keyCode);
  	    }
  	  }]);

  	  function Keyboard(quill, options) {
  	    _classCallCheck(this, Keyboard);

  	    var _this = _possibleConstructorReturn(this, (Keyboard.__proto__ || Object.getPrototypeOf(Keyboard)).call(this, quill, options));

  	    _this.bindings = {};
  	    Object.keys(_this.options.bindings).forEach(function (name) {
  	      if (name === 'list autofill' && quill.scroll.whitelist != null && !quill.scroll.whitelist['list']) {
  	        return;
  	      }
  	      if (_this.options.bindings[name]) {
  	        _this.addBinding(_this.options.bindings[name]);
  	      }
  	    });
  	    _this.addBinding({ key: Keyboard.keys.ENTER, shiftKey: null }, handleEnter);
  	    _this.addBinding({ key: Keyboard.keys.ENTER, metaKey: null, ctrlKey: null, altKey: null }, function () {});
  	    if (/Firefox/i.test(navigator.userAgent)) {
  	      // Need to handle delete and backspace for Firefox in the general case #1171
  	      _this.addBinding({ key: Keyboard.keys.BACKSPACE }, { collapsed: true }, handleBackspace);
  	      _this.addBinding({ key: Keyboard.keys.DELETE }, { collapsed: true }, handleDelete);
  	    } else {
  	      _this.addBinding({ key: Keyboard.keys.BACKSPACE }, { collapsed: true, prefix: /^.?$/ }, handleBackspace);
  	      _this.addBinding({ key: Keyboard.keys.DELETE }, { collapsed: true, suffix: /^.?$/ }, handleDelete);
  	    }
  	    _this.addBinding({ key: Keyboard.keys.BACKSPACE }, { collapsed: false }, handleDeleteRange);
  	    _this.addBinding({ key: Keyboard.keys.DELETE }, { collapsed: false }, handleDeleteRange);
  	    _this.addBinding({ key: Keyboard.keys.BACKSPACE, altKey: null, ctrlKey: null, metaKey: null, shiftKey: null }, { collapsed: true, offset: 0 }, handleBackspace);
  	    _this.listen();
  	    return _this;
  	  }

  	  _createClass(Keyboard, [{
  	    key: 'addBinding',
  	    value: function addBinding(key) {
  	      var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  	      var handler = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  	      var binding = normalize(key);
  	      if (binding == null || binding.key == null) {
  	        return debug.warn('Attempted to add invalid keyboard binding', binding);
  	      }
  	      if (typeof context === 'function') {
  	        context = { handler: context };
  	      }
  	      if (typeof handler === 'function') {
  	        handler = { handler: handler };
  	      }
  	      binding = (0, _extend2.default)(binding, context, handler);
  	      this.bindings[binding.key] = this.bindings[binding.key] || [];
  	      this.bindings[binding.key].push(binding);
  	    }
  	  }, {
  	    key: 'listen',
  	    value: function listen() {
  	      var _this2 = this;

  	      this.quill.root.addEventListener('keydown', function (evt) {
  	        if (evt.defaultPrevented) return;
  	        var which = evt.which || evt.keyCode;
  	        var bindings = (_this2.bindings[which] || []).filter(function (binding) {
  	          return Keyboard.match(evt, binding);
  	        });
  	        if (bindings.length === 0) return;
  	        var range = _this2.quill.getSelection();
  	        if (range == null || !_this2.quill.hasFocus()) return;

  	        var _quill$getLine = _this2.quill.getLine(range.index),
  	            _quill$getLine2 = _slicedToArray(_quill$getLine, 2),
  	            line = _quill$getLine2[0],
  	            offset = _quill$getLine2[1];

  	        var _quill$getLeaf = _this2.quill.getLeaf(range.index),
  	            _quill$getLeaf2 = _slicedToArray(_quill$getLeaf, 2),
  	            leafStart = _quill$getLeaf2[0],
  	            offsetStart = _quill$getLeaf2[1];

  	        var _ref = range.length === 0 ? [leafStart, offsetStart] : _this2.quill.getLeaf(range.index + range.length),
  	            _ref2 = _slicedToArray(_ref, 2),
  	            leafEnd = _ref2[0],
  	            offsetEnd = _ref2[1];

  	        var prefixText = leafStart instanceof _parchment2.default.Text ? leafStart.value().slice(0, offsetStart) : '';
  	        var suffixText = leafEnd instanceof _parchment2.default.Text ? leafEnd.value().slice(offsetEnd) : '';
  	        var curContext = {
  	          collapsed: range.length === 0,
  	          empty: range.length === 0 && line.length() <= 1,
  	          format: _this2.quill.getFormat(range),
  	          offset: offset,
  	          prefix: prefixText,
  	          suffix: suffixText
  	        };
  	        var prevented = bindings.some(function (binding) {
  	          if (binding.collapsed != null && binding.collapsed !== curContext.collapsed) return false;
  	          if (binding.empty != null && binding.empty !== curContext.empty) return false;
  	          if (binding.offset != null && binding.offset !== curContext.offset) return false;
  	          if (Array.isArray(binding.format)) {
  	            // any format is present
  	            if (binding.format.every(function (name) {
  	              return curContext.format[name] == null;
  	            })) {
  	              return false;
  	            }
  	          } else if (_typeof(binding.format) === 'object') {
  	            // all formats must match
  	            if (!Object.keys(binding.format).every(function (name) {
  	              if (binding.format[name] === true) return curContext.format[name] != null;
  	              if (binding.format[name] === false) return curContext.format[name] == null;
  	              return (0, _deepEqual2.default)(binding.format[name], curContext.format[name]);
  	            })) {
  	              return false;
  	            }
  	          }
  	          if (binding.prefix != null && !binding.prefix.test(curContext.prefix)) return false;
  	          if (binding.suffix != null && !binding.suffix.test(curContext.suffix)) return false;
  	          return binding.handler.call(_this2, range, curContext) !== true;
  	        });
  	        if (prevented) {
  	          evt.preventDefault();
  	        }
  	      });
  	    }
  	  }]);

  	  return Keyboard;
  	}(_module2.default);

  	Keyboard.keys = {
  	  BACKSPACE: 8,
  	  TAB: 9,
  	  ENTER: 13,
  	  ESCAPE: 27,
  	  LEFT: 37,
  	  UP: 38,
  	  RIGHT: 39,
  	  DOWN: 40,
  	  DELETE: 46
  	};

  	Keyboard.DEFAULTS = {
  	  bindings: {
  	    'bold': makeFormatHandler('bold'),
  	    'italic': makeFormatHandler('italic'),
  	    'underline': makeFormatHandler('underline'),
  	    'indent': {
  	      // highlight tab or tab at beginning of list, indent or blockquote
  	      key: Keyboard.keys.TAB,
  	      format: ['blockquote', 'indent', 'list'],
  	      handler: function handler(range, context) {
  	        if (context.collapsed && context.offset !== 0) return true;
  	        this.quill.format('indent', '+1', _quill2.default.sources.USER);
  	      }
  	    },
  	    'outdent': {
  	      key: Keyboard.keys.TAB,
  	      shiftKey: true,
  	      format: ['blockquote', 'indent', 'list'],
  	      // highlight tab or tab at beginning of list, indent or blockquote
  	      handler: function handler(range, context) {
  	        if (context.collapsed && context.offset !== 0) return true;
  	        this.quill.format('indent', '-1', _quill2.default.sources.USER);
  	      }
  	    },
  	    'outdent backspace': {
  	      key: Keyboard.keys.BACKSPACE,
  	      collapsed: true,
  	      shiftKey: null,
  	      metaKey: null,
  	      ctrlKey: null,
  	      altKey: null,
  	      format: ['indent', 'list'],
  	      offset: 0,
  	      handler: function handler(range, context) {
  	        if (context.format.indent != null) {
  	          this.quill.format('indent', '-1', _quill2.default.sources.USER);
  	        } else if (context.format.list != null) {
  	          this.quill.format('list', false, _quill2.default.sources.USER);
  	        }
  	      }
  	    },
  	    'indent code-block': makeCodeBlockHandler(true),
  	    'outdent code-block': makeCodeBlockHandler(false),
  	    'remove tab': {
  	      key: Keyboard.keys.TAB,
  	      shiftKey: true,
  	      collapsed: true,
  	      prefix: /\t$/,
  	      handler: function handler(range) {
  	        this.quill.deleteText(range.index - 1, 1, _quill2.default.sources.USER);
  	      }
  	    },
  	    'tab': {
  	      key: Keyboard.keys.TAB,
  	      handler: function handler(range) {
  	        this.quill.history.cutoff();
  	        var delta = new _quillDelta2.default().retain(range.index).delete(range.length).insert('\t');
  	        this.quill.updateContents(delta, _quill2.default.sources.USER);
  	        this.quill.history.cutoff();
  	        this.quill.setSelection(range.index + 1, _quill2.default.sources.SILENT);
  	      }
  	    },
  	    'list empty enter': {
  	      key: Keyboard.keys.ENTER,
  	      collapsed: true,
  	      format: ['list'],
  	      empty: true,
  	      handler: function handler(range, context) {
  	        this.quill.format('list', false, _quill2.default.sources.USER);
  	        if (context.format.indent) {
  	          this.quill.format('indent', false, _quill2.default.sources.USER);
  	        }
  	      }
  	    },
  	    'checklist enter': {
  	      key: Keyboard.keys.ENTER,
  	      collapsed: true,
  	      format: { list: 'checked' },
  	      handler: function handler(range) {
  	        var _quill$getLine3 = this.quill.getLine(range.index),
  	            _quill$getLine4 = _slicedToArray(_quill$getLine3, 2),
  	            line = _quill$getLine4[0],
  	            offset = _quill$getLine4[1];

  	        var formats = (0, _extend2.default)({}, line.formats(), { list: 'checked' });
  	        var delta = new _quillDelta2.default().retain(range.index).insert('\n', formats).retain(line.length() - offset - 1).retain(1, { list: 'unchecked' });
  	        this.quill.updateContents(delta, _quill2.default.sources.USER);
  	        this.quill.setSelection(range.index + 1, _quill2.default.sources.SILENT);
  	        this.quill.scrollIntoView();
  	      }
  	    },
  	    'header enter': {
  	      key: Keyboard.keys.ENTER,
  	      collapsed: true,
  	      format: ['header'],
  	      suffix: /^$/,
  	      handler: function handler(range, context) {
  	        var _quill$getLine5 = this.quill.getLine(range.index),
  	            _quill$getLine6 = _slicedToArray(_quill$getLine5, 2),
  	            line = _quill$getLine6[0],
  	            offset = _quill$getLine6[1];

  	        var delta = new _quillDelta2.default().retain(range.index).insert('\n', context.format).retain(line.length() - offset - 1).retain(1, { header: null });
  	        this.quill.updateContents(delta, _quill2.default.sources.USER);
  	        this.quill.setSelection(range.index + 1, _quill2.default.sources.SILENT);
  	        this.quill.scrollIntoView();
  	      }
  	    },
  	    'list autofill': {
  	      key: ' ',
  	      collapsed: true,
  	      format: { list: false },
  	      prefix: /^\s*?(\d+\.|-|\*|\[ ?\]|\[x\])$/,
  	      handler: function handler(range, context) {
  	        var length = context.prefix.length;

  	        var _quill$getLine7 = this.quill.getLine(range.index),
  	            _quill$getLine8 = _slicedToArray(_quill$getLine7, 2),
  	            line = _quill$getLine8[0],
  	            offset = _quill$getLine8[1];

  	        if (offset > length) return true;
  	        var value = void 0;
  	        switch (context.prefix.trim()) {
  	          case '[]':case '[ ]':
  	            value = 'unchecked';
  	            break;
  	          case '[x]':
  	            value = 'checked';
  	            break;
  	          case '-':case '*':
  	            value = 'bullet';
  	            break;
  	          default:
  	            value = 'ordered';
  	        }
  	        this.quill.insertText(range.index, ' ', _quill2.default.sources.USER);
  	        this.quill.history.cutoff();
  	        var delta = new _quillDelta2.default().retain(range.index - offset).delete(length + 1).retain(line.length() - 2 - offset).retain(1, { list: value });
  	        this.quill.updateContents(delta, _quill2.default.sources.USER);
  	        this.quill.history.cutoff();
  	        this.quill.setSelection(range.index - length, _quill2.default.sources.SILENT);
  	      }
  	    },
  	    'code exit': {
  	      key: Keyboard.keys.ENTER,
  	      collapsed: true,
  	      format: ['code-block'],
  	      prefix: /\n\n$/,
  	      suffix: /^\s+$/,
  	      handler: function handler(range) {
  	        var _quill$getLine9 = this.quill.getLine(range.index),
  	            _quill$getLine10 = _slicedToArray(_quill$getLine9, 2),
  	            line = _quill$getLine10[0],
  	            offset = _quill$getLine10[1];

  	        var delta = new _quillDelta2.default().retain(range.index + line.length() - offset - 2).retain(1, { 'code-block': null }).delete(1);
  	        this.quill.updateContents(delta, _quill2.default.sources.USER);
  	      }
  	    },
  	    'embed left': makeEmbedArrowHandler(Keyboard.keys.LEFT, false),
  	    'embed left shift': makeEmbedArrowHandler(Keyboard.keys.LEFT, true),
  	    'embed right': makeEmbedArrowHandler(Keyboard.keys.RIGHT, false),
  	    'embed right shift': makeEmbedArrowHandler(Keyboard.keys.RIGHT, true)
  	  }
  	};

  	function makeEmbedArrowHandler(key, shiftKey) {
  	  var _ref3;

  	  var where = key === Keyboard.keys.LEFT ? 'prefix' : 'suffix';
  	  return _ref3 = {
  	    key: key,
  	    shiftKey: shiftKey,
  	    altKey: null
  	  }, _defineProperty(_ref3, where, /^$/), _defineProperty(_ref3, 'handler', function handler(range) {
  	    var index = range.index;
  	    if (key === Keyboard.keys.RIGHT) {
  	      index += range.length + 1;
  	    }

  	    var _quill$getLeaf3 = this.quill.getLeaf(index),
  	        _quill$getLeaf4 = _slicedToArray(_quill$getLeaf3, 1),
  	        leaf = _quill$getLeaf4[0];

  	    if (!(leaf instanceof _parchment2.default.Embed)) return true;
  	    if (key === Keyboard.keys.LEFT) {
  	      if (shiftKey) {
  	        this.quill.setSelection(range.index - 1, range.length + 1, _quill2.default.sources.USER);
  	      } else {
  	        this.quill.setSelection(range.index - 1, _quill2.default.sources.USER);
  	      }
  	    } else {
  	      if (shiftKey) {
  	        this.quill.setSelection(range.index, range.length + 1, _quill2.default.sources.USER);
  	      } else {
  	        this.quill.setSelection(range.index + range.length + 1, _quill2.default.sources.USER);
  	      }
  	    }
  	    return false;
  	  }), _ref3;
  	}

  	function handleBackspace(range, context) {
  	  if (range.index === 0 || this.quill.getLength() <= 1) return;

  	  var _quill$getLine11 = this.quill.getLine(range.index),
  	      _quill$getLine12 = _slicedToArray(_quill$getLine11, 1),
  	      line = _quill$getLine12[0];

  	  var formats = {};
  	  if (context.offset === 0) {
  	    var _quill$getLine13 = this.quill.getLine(range.index - 1),
  	        _quill$getLine14 = _slicedToArray(_quill$getLine13, 1),
  	        prev = _quill$getLine14[0];

  	    if (prev != null && prev.length() > 1) {
  	      var curFormats = line.formats();
  	      var prevFormats = this.quill.getFormat(range.index - 1, 1);
  	      formats = _op2.default.attributes.diff(curFormats, prevFormats) || {};
  	    }
  	  }
  	  // Check for astral symbols
  	  var length = /[\uD800-\uDBFF][\uDC00-\uDFFF]$/.test(context.prefix) ? 2 : 1;
  	  this.quill.deleteText(range.index - length, length, _quill2.default.sources.USER);
  	  if (Object.keys(formats).length > 0) {
  	    this.quill.formatLine(range.index - length, length, formats, _quill2.default.sources.USER);
  	  }
  	  this.quill.focus();
  	}

  	function handleDelete(range, context) {
  	  // Check for astral symbols
  	  var length = /^[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(context.suffix) ? 2 : 1;
  	  if (range.index >= this.quill.getLength() - length) return;
  	  var formats = {},
  	      nextLength = 0;

  	  var _quill$getLine15 = this.quill.getLine(range.index),
  	      _quill$getLine16 = _slicedToArray(_quill$getLine15, 1),
  	      line = _quill$getLine16[0];

  	  if (context.offset >= line.length() - 1) {
  	    var _quill$getLine17 = this.quill.getLine(range.index + 1),
  	        _quill$getLine18 = _slicedToArray(_quill$getLine17, 1),
  	        next = _quill$getLine18[0];

  	    if (next) {
  	      var curFormats = line.formats();
  	      var nextFormats = this.quill.getFormat(range.index, 1);
  	      formats = _op2.default.attributes.diff(curFormats, nextFormats) || {};
  	      nextLength = next.length();
  	    }
  	  }
  	  this.quill.deleteText(range.index, length, _quill2.default.sources.USER);
  	  if (Object.keys(formats).length > 0) {
  	    this.quill.formatLine(range.index + nextLength - 1, length, formats, _quill2.default.sources.USER);
  	  }
  	}

  	function handleDeleteRange(range) {
  	  var lines = this.quill.getLines(range);
  	  var formats = {};
  	  if (lines.length > 1) {
  	    var firstFormats = lines[0].formats();
  	    var lastFormats = lines[lines.length - 1].formats();
  	    formats = _op2.default.attributes.diff(lastFormats, firstFormats) || {};
  	  }
  	  this.quill.deleteText(range, _quill2.default.sources.USER);
  	  if (Object.keys(formats).length > 0) {
  	    this.quill.formatLine(range.index, 1, formats, _quill2.default.sources.USER);
  	  }
  	  this.quill.setSelection(range.index, _quill2.default.sources.SILENT);
  	  this.quill.focus();
  	}

  	function handleEnter(range, context) {
  	  var _this3 = this;

  	  if (range.length > 0) {
  	    this.quill.scroll.deleteAt(range.index, range.length); // So we do not trigger text-change
  	  }
  	  var lineFormats = Object.keys(context.format).reduce(function (lineFormats, format) {
  	    if (_parchment2.default.query(format, _parchment2.default.Scope.BLOCK) && !Array.isArray(context.format[format])) {
  	      lineFormats[format] = context.format[format];
  	    }
  	    return lineFormats;
  	  }, {});
  	  this.quill.insertText(range.index, '\n', lineFormats, _quill2.default.sources.USER);
  	  // Earlier scroll.deleteAt might have messed up our selection,
  	  // so insertText's built in selection preservation is not reliable
  	  this.quill.setSelection(range.index + 1, _quill2.default.sources.SILENT);
  	  this.quill.focus();
  	  Object.keys(context.format).forEach(function (name) {
  	    if (lineFormats[name] != null) return;
  	    if (Array.isArray(context.format[name])) return;
  	    if (name === 'link') return;
  	    _this3.quill.format(name, context.format[name], _quill2.default.sources.USER);
  	  });
  	}

  	function makeCodeBlockHandler(indent) {
  	  return {
  	    key: Keyboard.keys.TAB,
  	    shiftKey: !indent,
  	    format: { 'code-block': true },
  	    handler: function handler(range) {
  	      var CodeBlock = _parchment2.default.query('code-block');
  	      var index = range.index,
  	          length = range.length;

  	      var _quill$scroll$descend = this.quill.scroll.descendant(CodeBlock, index),
  	          _quill$scroll$descend2 = _slicedToArray(_quill$scroll$descend, 2),
  	          block = _quill$scroll$descend2[0],
  	          offset = _quill$scroll$descend2[1];

  	      if (block == null) return;
  	      var scrollIndex = this.quill.getIndex(block);
  	      var start = block.newlineIndex(offset, true) + 1;
  	      var end = block.newlineIndex(scrollIndex + offset + length);
  	      var lines = block.domNode.textContent.slice(start, end).split('\n');
  	      offset = 0;
  	      lines.forEach(function (line, i) {
  	        if (indent) {
  	          block.insertAt(start + offset, CodeBlock.TAB);
  	          offset += CodeBlock.TAB.length;
  	          if (i === 0) {
  	            index += CodeBlock.TAB.length;
  	          } else {
  	            length += CodeBlock.TAB.length;
  	          }
  	        } else if (line.startsWith(CodeBlock.TAB)) {
  	          block.deleteAt(start + offset, CodeBlock.TAB.length);
  	          offset -= CodeBlock.TAB.length;
  	          if (i === 0) {
  	            index -= CodeBlock.TAB.length;
  	          } else {
  	            length -= CodeBlock.TAB.length;
  	          }
  	        }
  	        offset += line.length + 1;
  	      });
  	      this.quill.update(_quill2.default.sources.USER);
  	      this.quill.setSelection(index, length, _quill2.default.sources.SILENT);
  	    }
  	  };
  	}

  	function makeFormatHandler(format) {
  	  return {
  	    key: format[0].toUpperCase(),
  	    shortKey: true,
  	    handler: function handler(range, context) {
  	      this.quill.format(format, !context.format[format], _quill2.default.sources.USER);
  	    }
  	  };
  	}

  	function normalize(binding) {
  	  if (typeof binding === 'string' || typeof binding === 'number') {
  	    return normalize({ key: binding });
  	  }
  	  if ((typeof binding === 'undefined' ? 'undefined' : _typeof(binding)) === 'object') {
  	    binding = (0, _clone2.default)(binding, false);
  	  }
  	  if (typeof binding.key === 'string') {
  	    if (Keyboard.keys[binding.key.toUpperCase()] != null) {
  	      binding.key = Keyboard.keys[binding.key.toUpperCase()];
  	    } else if (binding.key.length === 1) {
  	      binding.key = binding.key.toUpperCase().charCodeAt(0);
  	    } else {
  	      return null;
  	    }
  	  }
  	  if (binding.shortKey) {
  	    binding[SHORTKEY] = binding.shortKey;
  	    delete binding.shortKey;
  	  }
  	  return binding;
  	}

  	exports.default = Keyboard;
  	exports.SHORTKEY = SHORTKEY;

  	/***/ }),
  	/* 24 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _text = __webpack_require__(7);

  	var _text2 = _interopRequireDefault(_text);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var Cursor = function (_Parchment$Embed) {
  	  _inherits(Cursor, _Parchment$Embed);

  	  _createClass(Cursor, null, [{
  	    key: 'value',
  	    value: function value() {
  	      return undefined;
  	    }
  	  }]);

  	  function Cursor(domNode, selection) {
  	    _classCallCheck(this, Cursor);

  	    var _this = _possibleConstructorReturn(this, (Cursor.__proto__ || Object.getPrototypeOf(Cursor)).call(this, domNode));

  	    _this.selection = selection;
  	    _this.textNode = document.createTextNode(Cursor.CONTENTS);
  	    _this.domNode.appendChild(_this.textNode);
  	    _this._length = 0;
  	    return _this;
  	  }

  	  _createClass(Cursor, [{
  	    key: 'detach',
  	    value: function detach() {
  	      // super.detach() will also clear domNode.__blot
  	      if (this.parent != null) this.parent.removeChild(this);
  	    }
  	  }, {
  	    key: 'format',
  	    value: function format(name, value) {
  	      if (this._length !== 0) {
  	        return _get(Cursor.prototype.__proto__ || Object.getPrototypeOf(Cursor.prototype), 'format', this).call(this, name, value);
  	      }
  	      var target = this,
  	          index = 0;
  	      while (target != null && target.statics.scope !== _parchment2.default.Scope.BLOCK_BLOT) {
  	        index += target.offset(target.parent);
  	        target = target.parent;
  	      }
  	      if (target != null) {
  	        this._length = Cursor.CONTENTS.length;
  	        target.optimize();
  	        target.formatAt(index, Cursor.CONTENTS.length, name, value);
  	        this._length = 0;
  	      }
  	    }
  	  }, {
  	    key: 'index',
  	    value: function index(node, offset) {
  	      if (node === this.textNode) return 0;
  	      return _get(Cursor.prototype.__proto__ || Object.getPrototypeOf(Cursor.prototype), 'index', this).call(this, node, offset);
  	    }
  	  }, {
  	    key: 'length',
  	    value: function length() {
  	      return this._length;
  	    }
  	  }, {
  	    key: 'position',
  	    value: function position() {
  	      return [this.textNode, this.textNode.data.length];
  	    }
  	  }, {
  	    key: 'remove',
  	    value: function remove() {
  	      _get(Cursor.prototype.__proto__ || Object.getPrototypeOf(Cursor.prototype), 'remove', this).call(this);
  	      this.parent = null;
  	    }
  	  }, {
  	    key: 'restore',
  	    value: function restore() {
  	      if (this.selection.composing || this.parent == null) return;
  	      var textNode = this.textNode;
  	      var range = this.selection.getNativeRange();
  	      var restoreText = void 0,
  	          start = void 0,
  	          end = void 0;
  	      if (range != null && range.start.node === textNode && range.end.node === textNode) {
  	        var _ref = [textNode, range.start.offset, range.end.offset];
  	        restoreText = _ref[0];
  	        start = _ref[1];
  	        end = _ref[2];
  	      }
  	      // Link format will insert text outside of anchor tag
  	      while (this.domNode.lastChild != null && this.domNode.lastChild !== this.textNode) {
  	        this.domNode.parentNode.insertBefore(this.domNode.lastChild, this.domNode);
  	      }
  	      if (this.textNode.data !== Cursor.CONTENTS) {
  	        var text = this.textNode.data.split(Cursor.CONTENTS).join('');
  	        if (this.next instanceof _text2.default) {
  	          restoreText = this.next.domNode;
  	          this.next.insertAt(0, text);
  	          this.textNode.data = Cursor.CONTENTS;
  	        } else {
  	          this.textNode.data = text;
  	          this.parent.insertBefore(_parchment2.default.create(this.textNode), this);
  	          this.textNode = document.createTextNode(Cursor.CONTENTS);
  	          this.domNode.appendChild(this.textNode);
  	        }
  	      }
  	      this.remove();
  	      if (start != null) {
  	        var _map = [start, end].map(function (offset) {
  	          return Math.max(0, Math.min(restoreText.data.length, offset - 1));
  	        });

  	        var _map2 = _slicedToArray(_map, 2);

  	        start = _map2[0];
  	        end = _map2[1];

  	        return {
  	          startNode: restoreText,
  	          startOffset: start,
  	          endNode: restoreText,
  	          endOffset: end
  	        };
  	      }
  	    }
  	  }, {
  	    key: 'update',
  	    value: function update(mutations, context) {
  	      var _this2 = this;

  	      if (mutations.some(function (mutation) {
  	        return mutation.type === 'characterData' && mutation.target === _this2.textNode;
  	      })) {
  	        var range = this.restore();
  	        if (range) context.range = range;
  	      }
  	    }
  	  }, {
  	    key: 'value',
  	    value: function value() {
  	      return '';
  	    }
  	  }]);

  	  return Cursor;
  	}(_parchment2.default.Embed);

  	Cursor.blotName = 'cursor';
  	Cursor.className = 'ql-cursor';
  	Cursor.tagName = 'span';
  	Cursor.CONTENTS = '\uFEFF'; // Zero width no break space


  	exports.default = Cursor;

  	/***/ }),
  	/* 25 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _block = __webpack_require__(4);

  	var _block2 = _interopRequireDefault(_block);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var Container = function (_Parchment$Container) {
  	  _inherits(Container, _Parchment$Container);

  	  function Container() {
  	    _classCallCheck(this, Container);

  	    return _possibleConstructorReturn(this, (Container.__proto__ || Object.getPrototypeOf(Container)).apply(this, arguments));
  	  }

  	  return Container;
  	}(_parchment2.default.Container);

  	Container.allowedChildren = [_block2.default, _block.BlockEmbed, Container];

  	exports.default = Container;

  	/***/ }),
  	/* 26 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.ColorStyle = exports.ColorClass = exports.ColorAttributor = undefined;

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var ColorAttributor = function (_Parchment$Attributor) {
  	  _inherits(ColorAttributor, _Parchment$Attributor);

  	  function ColorAttributor() {
  	    _classCallCheck(this, ColorAttributor);

  	    return _possibleConstructorReturn(this, (ColorAttributor.__proto__ || Object.getPrototypeOf(ColorAttributor)).apply(this, arguments));
  	  }

  	  _createClass(ColorAttributor, [{
  	    key: 'value',
  	    value: function value(domNode) {
  	      var value = _get(ColorAttributor.prototype.__proto__ || Object.getPrototypeOf(ColorAttributor.prototype), 'value', this).call(this, domNode);
  	      if (!value.startsWith('rgb(')) return value;
  	      value = value.replace(/^[^\d]+/, '').replace(/[^\d]+$/, '');
  	      return '#' + value.split(',').map(function (component) {
  	        return ('00' + parseInt(component).toString(16)).slice(-2);
  	      }).join('');
  	    }
  	  }]);

  	  return ColorAttributor;
  	}(_parchment2.default.Attributor.Style);

  	var ColorClass = new _parchment2.default.Attributor.Class('color', 'ql-color', {
  	  scope: _parchment2.default.Scope.INLINE
  	});
  	var ColorStyle = new ColorAttributor('color', 'color', {
  	  scope: _parchment2.default.Scope.INLINE
  	});

  	exports.ColorAttributor = ColorAttributor;
  	exports.ColorClass = ColorClass;
  	exports.ColorStyle = ColorStyle;

  	/***/ }),
  	/* 27 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.sanitize = exports.default = undefined;

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _inline = __webpack_require__(6);

  	var _inline2 = _interopRequireDefault(_inline);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var Link = function (_Inline) {
  	  _inherits(Link, _Inline);

  	  function Link() {
  	    _classCallCheck(this, Link);

  	    return _possibleConstructorReturn(this, (Link.__proto__ || Object.getPrototypeOf(Link)).apply(this, arguments));
  	  }

  	  _createClass(Link, [{
  	    key: 'format',
  	    value: function format(name, value) {
  	      if (name !== this.statics.blotName || !value) return _get(Link.prototype.__proto__ || Object.getPrototypeOf(Link.prototype), 'format', this).call(this, name, value);
  	      value = this.constructor.sanitize(value);
  	      this.domNode.setAttribute('href', value);
  	    }
  	  }], [{
  	    key: 'create',
  	    value: function create(value) {
  	      var node = _get(Link.__proto__ || Object.getPrototypeOf(Link), 'create', this).call(this, value);
  	      value = this.sanitize(value);
  	      node.setAttribute('href', value);
  	      node.setAttribute('rel', 'noopener noreferrer');
  	      node.setAttribute('target', '_blank');
  	      return node;
  	    }
  	  }, {
  	    key: 'formats',
  	    value: function formats(domNode) {
  	      return domNode.getAttribute('href');
  	    }
  	  }, {
  	    key: 'sanitize',
  	    value: function sanitize(url) {
  	      return _sanitize(url, this.PROTOCOL_WHITELIST) ? url : this.SANITIZED_URL;
  	    }
  	  }]);

  	  return Link;
  	}(_inline2.default);

  	Link.blotName = 'link';
  	Link.tagName = 'A';
  	Link.SANITIZED_URL = 'about:blank';
  	Link.PROTOCOL_WHITELIST = ['http', 'https', 'mailto', 'tel'];

  	function _sanitize(url, protocols) {
  	  var anchor = document.createElement('a');
  	  anchor.href = url;
  	  var protocol = anchor.href.slice(0, anchor.href.indexOf(':'));
  	  return protocols.indexOf(protocol) > -1;
  	}

  	exports.default = Link;
  	exports.sanitize = _sanitize;

  	/***/ }),
  	/* 28 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _keyboard = __webpack_require__(23);

  	var _keyboard2 = _interopRequireDefault(_keyboard);

  	var _dropdown = __webpack_require__(107);

  	var _dropdown2 = _interopRequireDefault(_dropdown);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	var optionsCounter = 0;

  	function toggleAriaAttribute(element, attribute) {
  	  element.setAttribute(attribute, !(element.getAttribute(attribute) === 'true'));
  	}

  	var Picker = function () {
  	  function Picker(select) {
  	    var _this = this;

  	    _classCallCheck(this, Picker);

  	    this.select = select;
  	    this.container = document.createElement('span');
  	    this.buildPicker();
  	    this.select.style.display = 'none';
  	    this.select.parentNode.insertBefore(this.container, this.select);

  	    this.label.addEventListener('mousedown', function () {
  	      _this.togglePicker();
  	    });
  	    this.label.addEventListener('keydown', function (event) {
  	      switch (event.keyCode) {
  	        // Allows the "Enter" key to open the picker
  	        case _keyboard2.default.keys.ENTER:
  	          _this.togglePicker();
  	          break;

  	        // Allows the "Escape" key to close the picker
  	        case _keyboard2.default.keys.ESCAPE:
  	          _this.escape();
  	          event.preventDefault();
  	          break;
  	      }
  	    });
  	    this.select.addEventListener('change', this.update.bind(this));
  	  }

  	  _createClass(Picker, [{
  	    key: 'togglePicker',
  	    value: function togglePicker() {
  	      this.container.classList.toggle('ql-expanded');
  	      // Toggle aria-expanded and aria-hidden to make the picker accessible
  	      toggleAriaAttribute(this.label, 'aria-expanded');
  	      toggleAriaAttribute(this.options, 'aria-hidden');
  	    }
  	  }, {
  	    key: 'buildItem',
  	    value: function buildItem(option) {
  	      var _this2 = this;

  	      var item = document.createElement('span');
  	      item.tabIndex = '0';
  	      item.setAttribute('role', 'button');

  	      item.classList.add('ql-picker-item');
  	      if (option.hasAttribute('value')) {
  	        item.setAttribute('data-value', option.getAttribute('value'));
  	      }
  	      if (option.textContent) {
  	        item.setAttribute('data-label', option.textContent);
  	      }
  	      item.addEventListener('click', function () {
  	        _this2.selectItem(item, true);
  	      });
  	      item.addEventListener('keydown', function (event) {
  	        switch (event.keyCode) {
  	          // Allows the "Enter" key to select an item
  	          case _keyboard2.default.keys.ENTER:
  	            _this2.selectItem(item, true);
  	            event.preventDefault();
  	            break;

  	          // Allows the "Escape" key to close the picker
  	          case _keyboard2.default.keys.ESCAPE:
  	            _this2.escape();
  	            event.preventDefault();
  	            break;
  	        }
  	      });

  	      return item;
  	    }
  	  }, {
  	    key: 'buildLabel',
  	    value: function buildLabel() {
  	      var label = document.createElement('span');
  	      label.classList.add('ql-picker-label');
  	      label.innerHTML = _dropdown2.default;
  	      label.tabIndex = '0';
  	      label.setAttribute('role', 'button');
  	      label.setAttribute('aria-expanded', 'false');
  	      this.container.appendChild(label);
  	      return label;
  	    }
  	  }, {
  	    key: 'buildOptions',
  	    value: function buildOptions() {
  	      var _this3 = this;

  	      var options = document.createElement('span');
  	      options.classList.add('ql-picker-options');

  	      // Don't want screen readers to read this until options are visible
  	      options.setAttribute('aria-hidden', 'true');
  	      options.tabIndex = '-1';

  	      // Need a unique id for aria-controls
  	      options.id = 'ql-picker-options-' + optionsCounter;
  	      optionsCounter += 1;
  	      this.label.setAttribute('aria-controls', options.id);

  	      this.options = options;

  	      [].slice.call(this.select.options).forEach(function (option) {
  	        var item = _this3.buildItem(option);
  	        options.appendChild(item);
  	        if (option.selected === true) {
  	          _this3.selectItem(item);
  	        }
  	      });
  	      this.container.appendChild(options);
  	    }
  	  }, {
  	    key: 'buildPicker',
  	    value: function buildPicker() {
  	      var _this4 = this;

  	      [].slice.call(this.select.attributes).forEach(function (item) {
  	        _this4.container.setAttribute(item.name, item.value);
  	      });
  	      this.container.classList.add('ql-picker');
  	      this.label = this.buildLabel();
  	      this.buildOptions();
  	    }
  	  }, {
  	    key: 'escape',
  	    value: function escape() {
  	      var _this5 = this;

  	      // Close menu and return focus to trigger label
  	      this.close();
  	      // Need setTimeout for accessibility to ensure that the browser executes
  	      // focus on the next process thread and after any DOM content changes
  	      setTimeout(function () {
  	        return _this5.label.focus();
  	      }, 1);
  	    }
  	  }, {
  	    key: 'close',
  	    value: function close() {
  	      this.container.classList.remove('ql-expanded');
  	      this.label.setAttribute('aria-expanded', 'false');
  	      this.options.setAttribute('aria-hidden', 'true');
  	    }
  	  }, {
  	    key: 'selectItem',
  	    value: function selectItem(item) {
  	      var trigger = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  	      var selected = this.container.querySelector('.ql-selected');
  	      if (item === selected) return;
  	      if (selected != null) {
  	        selected.classList.remove('ql-selected');
  	      }
  	      if (item == null) return;
  	      item.classList.add('ql-selected');
  	      this.select.selectedIndex = [].indexOf.call(item.parentNode.children, item);
  	      if (item.hasAttribute('data-value')) {
  	        this.label.setAttribute('data-value', item.getAttribute('data-value'));
  	      } else {
  	        this.label.removeAttribute('data-value');
  	      }
  	      if (item.hasAttribute('data-label')) {
  	        this.label.setAttribute('data-label', item.getAttribute('data-label'));
  	      } else {
  	        this.label.removeAttribute('data-label');
  	      }
  	      if (trigger) {
  	        if (typeof Event === 'function') {
  	          this.select.dispatchEvent(new Event('change'));
  	        } else if ((typeof Event === 'undefined' ? 'undefined' : _typeof(Event)) === 'object') {
  	          // IE11
  	          var event = document.createEvent('Event');
  	          event.initEvent('change', true, true);
  	          this.select.dispatchEvent(event);
  	        }
  	        this.close();
  	      }
  	    }
  	  }, {
  	    key: 'update',
  	    value: function update() {
  	      var option = void 0;
  	      if (this.select.selectedIndex > -1) {
  	        var item = this.container.querySelector('.ql-picker-options').children[this.select.selectedIndex];
  	        option = this.select.options[this.select.selectedIndex];
  	        this.selectItem(item);
  	      } else {
  	        this.selectItem(null);
  	      }
  	      var isActive = option != null && option !== this.select.querySelector('option[selected]');
  	      this.label.classList.toggle('ql-active', isActive);
  	    }
  	  }]);

  	  return Picker;
  	}();

  	exports.default = Picker;

  	/***/ }),
  	/* 29 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _quill = __webpack_require__(5);

  	var _quill2 = _interopRequireDefault(_quill);

  	var _block = __webpack_require__(4);

  	var _block2 = _interopRequireDefault(_block);

  	var _break = __webpack_require__(16);

  	var _break2 = _interopRequireDefault(_break);

  	var _container = __webpack_require__(25);

  	var _container2 = _interopRequireDefault(_container);

  	var _cursor = __webpack_require__(24);

  	var _cursor2 = _interopRequireDefault(_cursor);

  	var _embed = __webpack_require__(35);

  	var _embed2 = _interopRequireDefault(_embed);

  	var _inline = __webpack_require__(6);

  	var _inline2 = _interopRequireDefault(_inline);

  	var _scroll = __webpack_require__(22);

  	var _scroll2 = _interopRequireDefault(_scroll);

  	var _text = __webpack_require__(7);

  	var _text2 = _interopRequireDefault(_text);

  	var _clipboard = __webpack_require__(55);

  	var _clipboard2 = _interopRequireDefault(_clipboard);

  	var _history = __webpack_require__(42);

  	var _history2 = _interopRequireDefault(_history);

  	var _keyboard = __webpack_require__(23);

  	var _keyboard2 = _interopRequireDefault(_keyboard);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	_quill2.default.register({
  	  'blots/block': _block2.default,
  	  'blots/block/embed': _block.BlockEmbed,
  	  'blots/break': _break2.default,
  	  'blots/container': _container2.default,
  	  'blots/cursor': _cursor2.default,
  	  'blots/embed': _embed2.default,
  	  'blots/inline': _inline2.default,
  	  'blots/scroll': _scroll2.default,
  	  'blots/text': _text2.default,

  	  'modules/clipboard': _clipboard2.default,
  	  'modules/history': _history2.default,
  	  'modules/keyboard': _keyboard2.default
  	});

  	_parchment2.default.register(_block2.default, _break2.default, _cursor2.default, _inline2.default, _scroll2.default, _text2.default);

  	exports.default = _quill2.default;

  	/***/ }),
  	/* 30 */
  	/***/ (function(module, exports, __webpack_require__) {

  	Object.defineProperty(exports, "__esModule", { value: true });
  	var Registry = __webpack_require__(1);
  	var ShadowBlot = /** @class */ (function () {
  	    function ShadowBlot(domNode) {
  	        this.domNode = domNode;
  	        // @ts-ignore
  	        this.domNode[Registry.DATA_KEY] = { blot: this };
  	    }
  	    Object.defineProperty(ShadowBlot.prototype, "statics", {
  	        // Hack for accessing inherited static methods
  	        get: function () {
  	            return this.constructor;
  	        },
  	        enumerable: true,
  	        configurable: true
  	    });
  	    ShadowBlot.create = function (value) {
  	        if (this.tagName == null) {
  	            throw new Registry.ParchmentError('Blot definition missing tagName');
  	        }
  	        var node;
  	        if (Array.isArray(this.tagName)) {
  	            if (typeof value === 'string') {
  	                value = value.toUpperCase();
  	                if (parseInt(value).toString() === value) {
  	                    value = parseInt(value);
  	                }
  	            }
  	            if (typeof value === 'number') {
  	                node = document.createElement(this.tagName[value - 1]);
  	            }
  	            else if (this.tagName.indexOf(value) > -1) {
  	                node = document.createElement(value);
  	            }
  	            else {
  	                node = document.createElement(this.tagName[0]);
  	            }
  	        }
  	        else {
  	            node = document.createElement(this.tagName);
  	        }
  	        if (this.className) {
  	            node.classList.add(this.className);
  	        }
  	        return node;
  	    };
  	    ShadowBlot.prototype.attach = function () {
  	        if (this.parent != null) {
  	            this.scroll = this.parent.scroll;
  	        }
  	    };
  	    ShadowBlot.prototype.clone = function () {
  	        var domNode = this.domNode.cloneNode(false);
  	        return Registry.create(domNode);
  	    };
  	    ShadowBlot.prototype.detach = function () {
  	        if (this.parent != null)
  	            this.parent.removeChild(this);
  	        // @ts-ignore
  	        delete this.domNode[Registry.DATA_KEY];
  	    };
  	    ShadowBlot.prototype.deleteAt = function (index, length) {
  	        var blot = this.isolate(index, length);
  	        blot.remove();
  	    };
  	    ShadowBlot.prototype.formatAt = function (index, length, name, value) {
  	        var blot = this.isolate(index, length);
  	        if (Registry.query(name, Registry.Scope.BLOT) != null && value) {
  	            blot.wrap(name, value);
  	        }
  	        else if (Registry.query(name, Registry.Scope.ATTRIBUTE) != null) {
  	            var parent = Registry.create(this.statics.scope);
  	            blot.wrap(parent);
  	            parent.format(name, value);
  	        }
  	    };
  	    ShadowBlot.prototype.insertAt = function (index, value, def) {
  	        var blot = def == null ? Registry.create('text', value) : Registry.create(value, def);
  	        var ref = this.split(index);
  	        this.parent.insertBefore(blot, ref);
  	    };
  	    ShadowBlot.prototype.insertInto = function (parentBlot, refBlot) {
  	        if (refBlot === void 0) { refBlot = null; }
  	        if (this.parent != null) {
  	            this.parent.children.remove(this);
  	        }
  	        var refDomNode = null;
  	        parentBlot.children.insertBefore(this, refBlot);
  	        if (refBlot != null) {
  	            refDomNode = refBlot.domNode;
  	        }
  	        if (this.domNode.parentNode != parentBlot.domNode ||
  	            this.domNode.nextSibling != refDomNode) {
  	            parentBlot.domNode.insertBefore(this.domNode, refDomNode);
  	        }
  	        this.parent = parentBlot;
  	        this.attach();
  	    };
  	    ShadowBlot.prototype.isolate = function (index, length) {
  	        var target = this.split(index);
  	        target.split(length);
  	        return target;
  	    };
  	    ShadowBlot.prototype.length = function () {
  	        return 1;
  	    };
  	    ShadowBlot.prototype.offset = function (root) {
  	        if (root === void 0) { root = this.parent; }
  	        if (this.parent == null || this == root)
  	            return 0;
  	        return this.parent.children.offset(this) + this.parent.offset(root);
  	    };
  	    ShadowBlot.prototype.optimize = function (context) {
  	        // TODO clean up once we use WeakMap
  	        // @ts-ignore
  	        if (this.domNode[Registry.DATA_KEY] != null) {
  	            // @ts-ignore
  	            delete this.domNode[Registry.DATA_KEY].mutations;
  	        }
  	    };
  	    ShadowBlot.prototype.remove = function () {
  	        if (this.domNode.parentNode != null) {
  	            this.domNode.parentNode.removeChild(this.domNode);
  	        }
  	        this.detach();
  	    };
  	    ShadowBlot.prototype.replace = function (target) {
  	        if (target.parent == null)
  	            return;
  	        target.parent.insertBefore(this, target.next);
  	        target.remove();
  	    };
  	    ShadowBlot.prototype.replaceWith = function (name, value) {
  	        var replacement = typeof name === 'string' ? Registry.create(name, value) : name;
  	        replacement.replace(this);
  	        return replacement;
  	    };
  	    ShadowBlot.prototype.split = function (index, force) {
  	        return index === 0 ? this : this.next;
  	    };
  	    ShadowBlot.prototype.update = function (mutations, context) {
  	        // Nothing to do by default
  	    };
  	    ShadowBlot.prototype.wrap = function (name, value) {
  	        var wrapper = typeof name === 'string' ? Registry.create(name, value) : name;
  	        if (this.parent != null) {
  	            this.parent.insertBefore(wrapper, this.next);
  	        }
  	        wrapper.appendChild(this);
  	        return wrapper;
  	    };
  	    ShadowBlot.blotName = 'abstract';
  	    return ShadowBlot;
  	}());
  	exports.default = ShadowBlot;


  	/***/ }),
  	/* 31 */
  	/***/ (function(module, exports, __webpack_require__) {

  	Object.defineProperty(exports, "__esModule", { value: true });
  	var attributor_1 = __webpack_require__(12);
  	var class_1 = __webpack_require__(32);
  	var style_1 = __webpack_require__(33);
  	var Registry = __webpack_require__(1);
  	var AttributorStore = /** @class */ (function () {
  	    function AttributorStore(domNode) {
  	        this.attributes = {};
  	        this.domNode = domNode;
  	        this.build();
  	    }
  	    AttributorStore.prototype.attribute = function (attribute, value) {
  	        // verb
  	        if (value) {
  	            if (attribute.add(this.domNode, value)) {
  	                if (attribute.value(this.domNode) != null) {
  	                    this.attributes[attribute.attrName] = attribute;
  	                }
  	                else {
  	                    delete this.attributes[attribute.attrName];
  	                }
  	            }
  	        }
  	        else {
  	            attribute.remove(this.domNode);
  	            delete this.attributes[attribute.attrName];
  	        }
  	    };
  	    AttributorStore.prototype.build = function () {
  	        var _this = this;
  	        this.attributes = {};
  	        var attributes = attributor_1.default.keys(this.domNode);
  	        var classes = class_1.default.keys(this.domNode);
  	        var styles = style_1.default.keys(this.domNode);
  	        attributes
  	            .concat(classes)
  	            .concat(styles)
  	            .forEach(function (name) {
  	            var attr = Registry.query(name, Registry.Scope.ATTRIBUTE);
  	            if (attr instanceof attributor_1.default) {
  	                _this.attributes[attr.attrName] = attr;
  	            }
  	        });
  	    };
  	    AttributorStore.prototype.copy = function (target) {
  	        var _this = this;
  	        Object.keys(this.attributes).forEach(function (key) {
  	            var value = _this.attributes[key].value(_this.domNode);
  	            target.format(key, value);
  	        });
  	    };
  	    AttributorStore.prototype.move = function (target) {
  	        var _this = this;
  	        this.copy(target);
  	        Object.keys(this.attributes).forEach(function (key) {
  	            _this.attributes[key].remove(_this.domNode);
  	        });
  	        this.attributes = {};
  	    };
  	    AttributorStore.prototype.values = function () {
  	        var _this = this;
  	        return Object.keys(this.attributes).reduce(function (attributes, name) {
  	            attributes[name] = _this.attributes[name].value(_this.domNode);
  	            return attributes;
  	        }, {});
  	    };
  	    return AttributorStore;
  	}());
  	exports.default = AttributorStore;


  	/***/ }),
  	/* 32 */
  	/***/ (function(module, exports, __webpack_require__) {

  	var __extends = (this && this.__extends) || (function () {
  	    var extendStatics = Object.setPrototypeOf ||
  	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
  	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
  	    return function (d, b) {
  	        extendStatics(d, b);
  	        function __() { this.constructor = d; }
  	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  	    };
  	})();
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var attributor_1 = __webpack_require__(12);
  	function match(node, prefix) {
  	    var className = node.getAttribute('class') || '';
  	    return className.split(/\s+/).filter(function (name) {
  	        return name.indexOf(prefix + "-") === 0;
  	    });
  	}
  	var ClassAttributor = /** @class */ (function (_super) {
  	    __extends(ClassAttributor, _super);
  	    function ClassAttributor() {
  	        return _super !== null && _super.apply(this, arguments) || this;
  	    }
  	    ClassAttributor.keys = function (node) {
  	        return (node.getAttribute('class') || '').split(/\s+/).map(function (name) {
  	            return name
  	                .split('-')
  	                .slice(0, -1)
  	                .join('-');
  	        });
  	    };
  	    ClassAttributor.prototype.add = function (node, value) {
  	        if (!this.canAdd(node, value))
  	            return false;
  	        this.remove(node);
  	        node.classList.add(this.keyName + "-" + value);
  	        return true;
  	    };
  	    ClassAttributor.prototype.remove = function (node) {
  	        var matches = match(node, this.keyName);
  	        matches.forEach(function (name) {
  	            node.classList.remove(name);
  	        });
  	        if (node.classList.length === 0) {
  	            node.removeAttribute('class');
  	        }
  	    };
  	    ClassAttributor.prototype.value = function (node) {
  	        var result = match(node, this.keyName)[0] || '';
  	        var value = result.slice(this.keyName.length + 1); // +1 for hyphen
  	        return this.canAdd(node, value) ? value : '';
  	    };
  	    return ClassAttributor;
  	}(attributor_1.default));
  	exports.default = ClassAttributor;


  	/***/ }),
  	/* 33 */
  	/***/ (function(module, exports, __webpack_require__) {

  	var __extends = (this && this.__extends) || (function () {
  	    var extendStatics = Object.setPrototypeOf ||
  	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
  	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
  	    return function (d, b) {
  	        extendStatics(d, b);
  	        function __() { this.constructor = d; }
  	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  	    };
  	})();
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var attributor_1 = __webpack_require__(12);
  	function camelize(name) {
  	    var parts = name.split('-');
  	    var rest = parts
  	        .slice(1)
  	        .map(function (part) {
  	        return part[0].toUpperCase() + part.slice(1);
  	    })
  	        .join('');
  	    return parts[0] + rest;
  	}
  	var StyleAttributor = /** @class */ (function (_super) {
  	    __extends(StyleAttributor, _super);
  	    function StyleAttributor() {
  	        return _super !== null && _super.apply(this, arguments) || this;
  	    }
  	    StyleAttributor.keys = function (node) {
  	        return (node.getAttribute('style') || '').split(';').map(function (value) {
  	            var arr = value.split(':');
  	            return arr[0].trim();
  	        });
  	    };
  	    StyleAttributor.prototype.add = function (node, value) {
  	        if (!this.canAdd(node, value))
  	            return false;
  	        // @ts-ignore
  	        node.style[camelize(this.keyName)] = value;
  	        return true;
  	    };
  	    StyleAttributor.prototype.remove = function (node) {
  	        // @ts-ignore
  	        node.style[camelize(this.keyName)] = '';
  	        if (!node.getAttribute('style')) {
  	            node.removeAttribute('style');
  	        }
  	    };
  	    StyleAttributor.prototype.value = function (node) {
  	        // @ts-ignore
  	        var value = node.style[camelize(this.keyName)];
  	        return this.canAdd(node, value) ? value : '';
  	    };
  	    return StyleAttributor;
  	}(attributor_1.default));
  	exports.default = StyleAttributor;


  	/***/ }),
  	/* 34 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	var Theme = function () {
  	  function Theme(quill, options) {
  	    _classCallCheck(this, Theme);

  	    this.quill = quill;
  	    this.options = options;
  	    this.modules = {};
  	  }

  	  _createClass(Theme, [{
  	    key: 'init',
  	    value: function init() {
  	      var _this = this;

  	      Object.keys(this.options.modules).forEach(function (name) {
  	        if (_this.modules[name] == null) {
  	          _this.addModule(name);
  	        }
  	      });
  	    }
  	  }, {
  	    key: 'addModule',
  	    value: function addModule(name) {
  	      var moduleClass = this.quill.constructor.import('modules/' + name);
  	      this.modules[name] = new moduleClass(this.quill, this.options.modules[name] || {});
  	      return this.modules[name];
  	    }
  	  }]);

  	  return Theme;
  	}();

  	Theme.DEFAULTS = {
  	  modules: {}
  	};
  	Theme.themes = {
  	  'default': Theme
  	};

  	exports.default = Theme;

  	/***/ }),
  	/* 35 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _text = __webpack_require__(7);

  	var _text2 = _interopRequireDefault(_text);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var GUARD_TEXT = '\uFEFF';

  	var Embed = function (_Parchment$Embed) {
  	  _inherits(Embed, _Parchment$Embed);

  	  function Embed(node) {
  	    _classCallCheck(this, Embed);

  	    var _this = _possibleConstructorReturn(this, (Embed.__proto__ || Object.getPrototypeOf(Embed)).call(this, node));

  	    _this.contentNode = document.createElement('span');
  	    _this.contentNode.setAttribute('contenteditable', false);
  	    [].slice.call(_this.domNode.childNodes).forEach(function (childNode) {
  	      _this.contentNode.appendChild(childNode);
  	    });
  	    _this.leftGuard = document.createTextNode(GUARD_TEXT);
  	    _this.rightGuard = document.createTextNode(GUARD_TEXT);
  	    _this.domNode.appendChild(_this.leftGuard);
  	    _this.domNode.appendChild(_this.contentNode);
  	    _this.domNode.appendChild(_this.rightGuard);
  	    return _this;
  	  }

  	  _createClass(Embed, [{
  	    key: 'index',
  	    value: function index(node, offset) {
  	      if (node === this.leftGuard) return 0;
  	      if (node === this.rightGuard) return 1;
  	      return _get(Embed.prototype.__proto__ || Object.getPrototypeOf(Embed.prototype), 'index', this).call(this, node, offset);
  	    }
  	  }, {
  	    key: 'restore',
  	    value: function restore(node) {
  	      var range = void 0,
  	          textNode = void 0;
  	      var text = node.data.split(GUARD_TEXT).join('');
  	      if (node === this.leftGuard) {
  	        if (this.prev instanceof _text2.default) {
  	          var prevLength = this.prev.length();
  	          this.prev.insertAt(prevLength, text);
  	          range = {
  	            startNode: this.prev.domNode,
  	            startOffset: prevLength + text.length
  	          };
  	        } else {
  	          textNode = document.createTextNode(text);
  	          this.parent.insertBefore(_parchment2.default.create(textNode), this);
  	          range = {
  	            startNode: textNode,
  	            startOffset: text.length
  	          };
  	        }
  	      } else if (node === this.rightGuard) {
  	        if (this.next instanceof _text2.default) {
  	          this.next.insertAt(0, text);
  	          range = {
  	            startNode: this.next.domNode,
  	            startOffset: text.length
  	          };
  	        } else {
  	          textNode = document.createTextNode(text);
  	          this.parent.insertBefore(_parchment2.default.create(textNode), this.next);
  	          range = {
  	            startNode: textNode,
  	            startOffset: text.length
  	          };
  	        }
  	      }
  	      node.data = GUARD_TEXT;
  	      return range;
  	    }
  	  }, {
  	    key: 'update',
  	    value: function update(mutations, context) {
  	      var _this2 = this;

  	      mutations.forEach(function (mutation) {
  	        if (mutation.type === 'characterData' && (mutation.target === _this2.leftGuard || mutation.target === _this2.rightGuard)) {
  	          var range = _this2.restore(mutation.target);
  	          if (range) context.range = range;
  	        }
  	      });
  	    }
  	  }]);

  	  return Embed;
  	}(_parchment2.default.Embed);

  	exports.default = Embed;

  	/***/ }),
  	/* 36 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.AlignStyle = exports.AlignClass = exports.AlignAttribute = undefined;

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	var config = {
  	  scope: _parchment2.default.Scope.BLOCK,
  	  whitelist: ['right', 'center', 'justify']
  	};

  	var AlignAttribute = new _parchment2.default.Attributor.Attribute('align', 'align', config);
  	var AlignClass = new _parchment2.default.Attributor.Class('align', 'ql-align', config);
  	var AlignStyle = new _parchment2.default.Attributor.Style('align', 'text-align', config);

  	exports.AlignAttribute = AlignAttribute;
  	exports.AlignClass = AlignClass;
  	exports.AlignStyle = AlignStyle;

  	/***/ }),
  	/* 37 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.BackgroundStyle = exports.BackgroundClass = undefined;

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _color = __webpack_require__(26);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	var BackgroundClass = new _parchment2.default.Attributor.Class('background', 'ql-bg', {
  	  scope: _parchment2.default.Scope.INLINE
  	});
  	var BackgroundStyle = new _color.ColorAttributor('background', 'background-color', {
  	  scope: _parchment2.default.Scope.INLINE
  	});

  	exports.BackgroundClass = BackgroundClass;
  	exports.BackgroundStyle = BackgroundStyle;

  	/***/ }),
  	/* 38 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.DirectionStyle = exports.DirectionClass = exports.DirectionAttribute = undefined;

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	var config = {
  	  scope: _parchment2.default.Scope.BLOCK,
  	  whitelist: ['rtl']
  	};

  	var DirectionAttribute = new _parchment2.default.Attributor.Attribute('direction', 'dir', config);
  	var DirectionClass = new _parchment2.default.Attributor.Class('direction', 'ql-direction', config);
  	var DirectionStyle = new _parchment2.default.Attributor.Style('direction', 'direction', config);

  	exports.DirectionAttribute = DirectionAttribute;
  	exports.DirectionClass = DirectionClass;
  	exports.DirectionStyle = DirectionStyle;

  	/***/ }),
  	/* 39 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.FontClass = exports.FontStyle = undefined;

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var config = {
  	  scope: _parchment2.default.Scope.INLINE,
  	  whitelist: ['serif', 'monospace']
  	};

  	var FontClass = new _parchment2.default.Attributor.Class('font', 'ql-font', config);

  	var FontStyleAttributor = function (_Parchment$Attributor) {
  	  _inherits(FontStyleAttributor, _Parchment$Attributor);

  	  function FontStyleAttributor() {
  	    _classCallCheck(this, FontStyleAttributor);

  	    return _possibleConstructorReturn(this, (FontStyleAttributor.__proto__ || Object.getPrototypeOf(FontStyleAttributor)).apply(this, arguments));
  	  }

  	  _createClass(FontStyleAttributor, [{
  	    key: 'value',
  	    value: function value(node) {
  	      return _get(FontStyleAttributor.prototype.__proto__ || Object.getPrototypeOf(FontStyleAttributor.prototype), 'value', this).call(this, node).replace(/["']/g, '');
  	    }
  	  }]);

  	  return FontStyleAttributor;
  	}(_parchment2.default.Attributor.Style);

  	var FontStyle = new FontStyleAttributor('font', 'font-family', config);

  	exports.FontStyle = FontStyle;
  	exports.FontClass = FontClass;

  	/***/ }),
  	/* 40 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.SizeStyle = exports.SizeClass = undefined;

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	var SizeClass = new _parchment2.default.Attributor.Class('size', 'ql-size', {
  	  scope: _parchment2.default.Scope.INLINE,
  	  whitelist: ['small', 'large', 'huge']
  	});
  	var SizeStyle = new _parchment2.default.Attributor.Style('size', 'font-size', {
  	  scope: _parchment2.default.Scope.INLINE,
  	  whitelist: ['10px', '18px', '32px']
  	});

  	exports.SizeClass = SizeClass;
  	exports.SizeStyle = SizeStyle;

  	/***/ }),
  	/* 41 */
  	/***/ (function(module, exports, __webpack_require__) {


  	module.exports = {
  	  'align': {
  	    '': __webpack_require__(76),
  	    'center': __webpack_require__(77),
  	    'right': __webpack_require__(78),
  	    'justify': __webpack_require__(79)
  	  },
  	  'background': __webpack_require__(80),
  	  'blockquote': __webpack_require__(81),
  	  'bold': __webpack_require__(82),
  	  'clean': __webpack_require__(83),
  	  'code': __webpack_require__(58),
  	  'code-block': __webpack_require__(58),
  	  'color': __webpack_require__(84),
  	  'direction': {
  	    '': __webpack_require__(85),
  	    'rtl': __webpack_require__(86)
  	  },
  	  'float': {
  	    'center': __webpack_require__(87),
  	    'full': __webpack_require__(88),
  	    'left': __webpack_require__(89),
  	    'right': __webpack_require__(90)
  	  },
  	  'formula': __webpack_require__(91),
  	  'header': {
  	    '1': __webpack_require__(92),
  	    '2': __webpack_require__(93)
  	  },
  	  'italic': __webpack_require__(94),
  	  'image': __webpack_require__(95),
  	  'indent': {
  	    '+1': __webpack_require__(96),
  	    '-1': __webpack_require__(97)
  	  },
  	  'link': __webpack_require__(98),
  	  'list': {
  	    'ordered': __webpack_require__(99),
  	    'bullet': __webpack_require__(100),
  	    'check': __webpack_require__(101)
  	  },
  	  'script': {
  	    'sub': __webpack_require__(102),
  	    'super': __webpack_require__(103)
  	  },
  	  'strike': __webpack_require__(104),
  	  'underline': __webpack_require__(105),
  	  'video': __webpack_require__(106)
  	};

  	/***/ }),
  	/* 42 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.getLastChangeIndex = exports.default = undefined;

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _quill = __webpack_require__(5);

  	var _quill2 = _interopRequireDefault(_quill);

  	var _module = __webpack_require__(9);

  	var _module2 = _interopRequireDefault(_module);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var History = function (_Module) {
  	  _inherits(History, _Module);

  	  function History(quill, options) {
  	    _classCallCheck(this, History);

  	    var _this = _possibleConstructorReturn(this, (History.__proto__ || Object.getPrototypeOf(History)).call(this, quill, options));

  	    _this.lastRecorded = 0;
  	    _this.ignoreChange = false;
  	    _this.clear();
  	    _this.quill.on(_quill2.default.events.EDITOR_CHANGE, function (eventName, delta, oldDelta, source) {
  	      if (eventName !== _quill2.default.events.TEXT_CHANGE || _this.ignoreChange) return;
  	      if (!_this.options.userOnly || source === _quill2.default.sources.USER) {
  	        _this.record(delta, oldDelta);
  	      } else {
  	        _this.transform(delta);
  	      }
  	    });
  	    _this.quill.keyboard.addBinding({ key: 'Z', shortKey: true }, _this.undo.bind(_this));
  	    _this.quill.keyboard.addBinding({ key: 'Z', shortKey: true, shiftKey: true }, _this.redo.bind(_this));
  	    if (/Win/i.test(navigator.platform)) {
  	      _this.quill.keyboard.addBinding({ key: 'Y', shortKey: true }, _this.redo.bind(_this));
  	    }
  	    return _this;
  	  }

  	  _createClass(History, [{
  	    key: 'change',
  	    value: function change(source, dest) {
  	      if (this.stack[source].length === 0) return;
  	      var delta = this.stack[source].pop();
  	      this.stack[dest].push(delta);
  	      this.lastRecorded = 0;
  	      this.ignoreChange = true;
  	      this.quill.updateContents(delta[source], _quill2.default.sources.USER);
  	      this.ignoreChange = false;
  	      var index = getLastChangeIndex(delta[source]);
  	      this.quill.setSelection(index);
  	    }
  	  }, {
  	    key: 'clear',
  	    value: function clear() {
  	      this.stack = { undo: [], redo: [] };
  	    }
  	  }, {
  	    key: 'cutoff',
  	    value: function cutoff() {
  	      this.lastRecorded = 0;
  	    }
  	  }, {
  	    key: 'record',
  	    value: function record(changeDelta, oldDelta) {
  	      if (changeDelta.ops.length === 0) return;
  	      this.stack.redo = [];
  	      var undoDelta = this.quill.getContents().diff(oldDelta);
  	      var timestamp = Date.now();
  	      if (this.lastRecorded + this.options.delay > timestamp && this.stack.undo.length > 0) {
  	        var delta = this.stack.undo.pop();
  	        undoDelta = undoDelta.compose(delta.undo);
  	        changeDelta = delta.redo.compose(changeDelta);
  	      } else {
  	        this.lastRecorded = timestamp;
  	      }
  	      this.stack.undo.push({
  	        redo: changeDelta,
  	        undo: undoDelta
  	      });
  	      if (this.stack.undo.length > this.options.maxStack) {
  	        this.stack.undo.shift();
  	      }
  	    }
  	  }, {
  	    key: 'redo',
  	    value: function redo() {
  	      this.change('redo', 'undo');
  	    }
  	  }, {
  	    key: 'transform',
  	    value: function transform(delta) {
  	      this.stack.undo.forEach(function (change) {
  	        change.undo = delta.transform(change.undo, true);
  	        change.redo = delta.transform(change.redo, true);
  	      });
  	      this.stack.redo.forEach(function (change) {
  	        change.undo = delta.transform(change.undo, true);
  	        change.redo = delta.transform(change.redo, true);
  	      });
  	    }
  	  }, {
  	    key: 'undo',
  	    value: function undo() {
  	      this.change('undo', 'redo');
  	    }
  	  }]);

  	  return History;
  	}(_module2.default);

  	History.DEFAULTS = {
  	  delay: 1000,
  	  maxStack: 100,
  	  userOnly: false
  	};

  	function endsWithNewlineChange(delta) {
  	  var lastOp = delta.ops[delta.ops.length - 1];
  	  if (lastOp == null) return false;
  	  if (lastOp.insert != null) {
  	    return typeof lastOp.insert === 'string' && lastOp.insert.endsWith('\n');
  	  }
  	  if (lastOp.attributes != null) {
  	    return Object.keys(lastOp.attributes).some(function (attr) {
  	      return _parchment2.default.query(attr, _parchment2.default.Scope.BLOCK) != null;
  	    });
  	  }
  	  return false;
  	}

  	function getLastChangeIndex(delta) {
  	  var deleteLength = delta.reduce(function (length, op) {
  	    length += op.delete || 0;
  	    return length;
  	  }, 0);
  	  var changeIndex = delta.length() - deleteLength;
  	  if (endsWithNewlineChange(delta)) {
  	    changeIndex -= 1;
  	  }
  	  return changeIndex;
  	}

  	exports.default = History;
  	exports.getLastChangeIndex = getLastChangeIndex;

  	/***/ }),
  	/* 43 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.default = exports.BaseTooltip = undefined;

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _extend = __webpack_require__(3);

  	var _extend2 = _interopRequireDefault(_extend);

  	var _quillDelta = __webpack_require__(2);

  	var _quillDelta2 = _interopRequireDefault(_quillDelta);

  	var _emitter = __webpack_require__(8);

  	var _emitter2 = _interopRequireDefault(_emitter);

  	var _keyboard = __webpack_require__(23);

  	var _keyboard2 = _interopRequireDefault(_keyboard);

  	var _theme = __webpack_require__(34);

  	var _theme2 = _interopRequireDefault(_theme);

  	var _colorPicker = __webpack_require__(59);

  	var _colorPicker2 = _interopRequireDefault(_colorPicker);

  	var _iconPicker = __webpack_require__(60);

  	var _iconPicker2 = _interopRequireDefault(_iconPicker);

  	var _picker = __webpack_require__(28);

  	var _picker2 = _interopRequireDefault(_picker);

  	var _tooltip = __webpack_require__(61);

  	var _tooltip2 = _interopRequireDefault(_tooltip);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var ALIGNS = [false, 'center', 'right', 'justify'];

  	var COLORS = ["#000000", "#e60000", "#ff9900", "#ffff00", "#008a00", "#0066cc", "#9933ff", "#ffffff", "#facccc", "#ffebcc", "#ffffcc", "#cce8cc", "#cce0f5", "#ebd6ff", "#bbbbbb", "#f06666", "#ffc266", "#ffff66", "#66b966", "#66a3e0", "#c285ff", "#888888", "#a10000", "#b26b00", "#b2b200", "#006100", "#0047b2", "#6b24b2", "#444444", "#5c0000", "#663d00", "#666600", "#003700", "#002966", "#3d1466"];

  	var FONTS = [false, 'serif', 'monospace'];

  	var HEADERS = ['1', '2', '3', false];

  	var SIZES = ['small', false, 'large', 'huge'];

  	var BaseTheme = function (_Theme) {
  	  _inherits(BaseTheme, _Theme);

  	  function BaseTheme(quill, options) {
  	    _classCallCheck(this, BaseTheme);

  	    var _this = _possibleConstructorReturn(this, (BaseTheme.__proto__ || Object.getPrototypeOf(BaseTheme)).call(this, quill, options));

  	    var listener = function listener(e) {
  	      if (!document.body.contains(quill.root)) {
  	        return document.body.removeEventListener('click', listener);
  	      }
  	      if (_this.tooltip != null && !_this.tooltip.root.contains(e.target) && document.activeElement !== _this.tooltip.textbox && !_this.quill.hasFocus()) {
  	        _this.tooltip.hide();
  	      }
  	      if (_this.pickers != null) {
  	        _this.pickers.forEach(function (picker) {
  	          if (!picker.container.contains(e.target)) {
  	            picker.close();
  	          }
  	        });
  	      }
  	    };
  	    quill.emitter.listenDOM('click', document.body, listener);
  	    return _this;
  	  }

  	  _createClass(BaseTheme, [{
  	    key: 'addModule',
  	    value: function addModule(name) {
  	      var module = _get(BaseTheme.prototype.__proto__ || Object.getPrototypeOf(BaseTheme.prototype), 'addModule', this).call(this, name);
  	      if (name === 'toolbar') {
  	        this.extendToolbar(module);
  	      }
  	      return module;
  	    }
  	  }, {
  	    key: 'buildButtons',
  	    value: function buildButtons(buttons, icons) {
  	      buttons.forEach(function (button) {
  	        var className = button.getAttribute('class') || '';
  	        className.split(/\s+/).forEach(function (name) {
  	          if (!name.startsWith('ql-')) return;
  	          name = name.slice('ql-'.length);
  	          if (icons[name] == null) return;
  	          if (name === 'direction') {
  	            button.innerHTML = icons[name][''] + icons[name]['rtl'];
  	          } else if (typeof icons[name] === 'string') {
  	            button.innerHTML = icons[name];
  	          } else {
  	            var value = button.value || '';
  	            if (value != null && icons[name][value]) {
  	              button.innerHTML = icons[name][value];
  	            }
  	          }
  	        });
  	      });
  	    }
  	  }, {
  	    key: 'buildPickers',
  	    value: function buildPickers(selects, icons) {
  	      var _this2 = this;

  	      this.pickers = selects.map(function (select) {
  	        if (select.classList.contains('ql-align')) {
  	          if (select.querySelector('option') == null) {
  	            fillSelect(select, ALIGNS);
  	          }
  	          return new _iconPicker2.default(select, icons.align);
  	        } else if (select.classList.contains('ql-background') || select.classList.contains('ql-color')) {
  	          var format = select.classList.contains('ql-background') ? 'background' : 'color';
  	          if (select.querySelector('option') == null) {
  	            fillSelect(select, COLORS, format === 'background' ? '#ffffff' : '#000000');
  	          }
  	          return new _colorPicker2.default(select, icons[format]);
  	        } else {
  	          if (select.querySelector('option') == null) {
  	            if (select.classList.contains('ql-font')) {
  	              fillSelect(select, FONTS);
  	            } else if (select.classList.contains('ql-header')) {
  	              fillSelect(select, HEADERS);
  	            } else if (select.classList.contains('ql-size')) {
  	              fillSelect(select, SIZES);
  	            }
  	          }
  	          return new _picker2.default(select);
  	        }
  	      });
  	      var update = function update() {
  	        _this2.pickers.forEach(function (picker) {
  	          picker.update();
  	        });
  	      };
  	      this.quill.on(_emitter2.default.events.EDITOR_CHANGE, update);
  	    }
  	  }]);

  	  return BaseTheme;
  	}(_theme2.default);

  	BaseTheme.DEFAULTS = (0, _extend2.default)(true, {}, _theme2.default.DEFAULTS, {
  	  modules: {
  	    toolbar: {
  	      handlers: {
  	        formula: function formula() {
  	          this.quill.theme.tooltip.edit('formula');
  	        },
  	        image: function image() {
  	          var _this3 = this;

  	          var fileInput = this.container.querySelector('input.ql-image[type=file]');
  	          if (fileInput == null) {
  	            fileInput = document.createElement('input');
  	            fileInput.setAttribute('type', 'file');
  	            fileInput.setAttribute('accept', 'image/png, image/gif, image/jpeg, image/bmp, image/x-icon');
  	            fileInput.classList.add('ql-image');
  	            fileInput.addEventListener('change', function () {
  	              if (fileInput.files != null && fileInput.files[0] != null) {
  	                var reader = new FileReader();
  	                reader.onload = function (e) {
  	                  var range = _this3.quill.getSelection(true);
  	                  _this3.quill.updateContents(new _quillDelta2.default().retain(range.index).delete(range.length).insert({ image: e.target.result }), _emitter2.default.sources.USER);
  	                  _this3.quill.setSelection(range.index + 1, _emitter2.default.sources.SILENT);
  	                  fileInput.value = "";
  	                };
  	                reader.readAsDataURL(fileInput.files[0]);
  	              }
  	            });
  	            this.container.appendChild(fileInput);
  	          }
  	          fileInput.click();
  	        },
  	        video: function video() {
  	          this.quill.theme.tooltip.edit('video');
  	        }
  	      }
  	    }
  	  }
  	});

  	var BaseTooltip = function (_Tooltip) {
  	  _inherits(BaseTooltip, _Tooltip);

  	  function BaseTooltip(quill, boundsContainer) {
  	    _classCallCheck(this, BaseTooltip);

  	    var _this4 = _possibleConstructorReturn(this, (BaseTooltip.__proto__ || Object.getPrototypeOf(BaseTooltip)).call(this, quill, boundsContainer));

  	    _this4.textbox = _this4.root.querySelector('input[type="text"]');
  	    _this4.listen();
  	    return _this4;
  	  }

  	  _createClass(BaseTooltip, [{
  	    key: 'listen',
  	    value: function listen() {
  	      var _this5 = this;

  	      this.textbox.addEventListener('keydown', function (event) {
  	        if (_keyboard2.default.match(event, 'enter')) {
  	          _this5.save();
  	          event.preventDefault();
  	        } else if (_keyboard2.default.match(event, 'escape')) {
  	          _this5.cancel();
  	          event.preventDefault();
  	        }
  	      });
  	    }
  	  }, {
  	    key: 'cancel',
  	    value: function cancel() {
  	      this.hide();
  	    }
  	  }, {
  	    key: 'edit',
  	    value: function edit() {
  	      var mode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'link';
  	      var preview = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

  	      this.root.classList.remove('ql-hidden');
  	      this.root.classList.add('ql-editing');
  	      if (preview != null) {
  	        this.textbox.value = preview;
  	      } else if (mode !== this.root.getAttribute('data-mode')) {
  	        this.textbox.value = '';
  	      }
  	      this.position(this.quill.getBounds(this.quill.selection.savedRange));
  	      this.textbox.select();
  	      this.textbox.setAttribute('placeholder', this.textbox.getAttribute('data-' + mode) || '');
  	      this.root.setAttribute('data-mode', mode);
  	    }
  	  }, {
  	    key: 'restoreFocus',
  	    value: function restoreFocus() {
  	      var scrollTop = this.quill.scrollingContainer.scrollTop;
  	      this.quill.focus();
  	      this.quill.scrollingContainer.scrollTop = scrollTop;
  	    }
  	  }, {
  	    key: 'save',
  	    value: function save() {
  	      var value = this.textbox.value;
  	      switch (this.root.getAttribute('data-mode')) {
  	        case 'link':
  	          {
  	            var scrollTop = this.quill.root.scrollTop;
  	            if (this.linkRange) {
  	              this.quill.formatText(this.linkRange, 'link', value, _emitter2.default.sources.USER);
  	              delete this.linkRange;
  	            } else {
  	              this.restoreFocus();
  	              this.quill.format('link', value, _emitter2.default.sources.USER);
  	            }
  	            this.quill.root.scrollTop = scrollTop;
  	            break;
  	          }
  	        case 'video':
  	          {
  	            value = extractVideoUrl(value);
  	          } // eslint-disable-next-line no-fallthrough
  	        case 'formula':
  	          {
  	            if (!value) break;
  	            var range = this.quill.getSelection(true);
  	            if (range != null) {
  	              var index = range.index + range.length;
  	              this.quill.insertEmbed(index, this.root.getAttribute('data-mode'), value, _emitter2.default.sources.USER);
  	              if (this.root.getAttribute('data-mode') === 'formula') {
  	                this.quill.insertText(index + 1, ' ', _emitter2.default.sources.USER);
  	              }
  	              this.quill.setSelection(index + 2, _emitter2.default.sources.USER);
  	            }
  	            break;
  	          }
  	      }
  	      this.textbox.value = '';
  	      this.hide();
  	    }
  	  }]);

  	  return BaseTooltip;
  	}(_tooltip2.default);

  	function extractVideoUrl(url) {
  	  var match = url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/) || url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/);
  	  if (match) {
  	    return (match[1] || 'https') + '://www.youtube.com/embed/' + match[2] + '?showinfo=0';
  	  }
  	  if (match = url.match(/^(?:(https?):\/\/)?(?:www\.)?vimeo\.com\/(\d+)/)) {
  	    // eslint-disable-line no-cond-assign
  	    return (match[1] || 'https') + '://player.vimeo.com/video/' + match[2] + '/';
  	  }
  	  return url;
  	}

  	function fillSelect(select, values) {
  	  var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  	  values.forEach(function (value) {
  	    var option = document.createElement('option');
  	    if (value === defaultValue) {
  	      option.setAttribute('selected', 'selected');
  	    } else {
  	      option.setAttribute('value', value);
  	    }
  	    select.appendChild(option);
  	  });
  	}

  	exports.BaseTooltip = BaseTooltip;
  	exports.default = BaseTheme;

  	/***/ }),
  	/* 44 */
  	/***/ (function(module, exports, __webpack_require__) {

  	Object.defineProperty(exports, "__esModule", { value: true });
  	var LinkedList = /** @class */ (function () {
  	    function LinkedList() {
  	        this.head = this.tail = null;
  	        this.length = 0;
  	    }
  	    LinkedList.prototype.append = function () {
  	        var nodes = [];
  	        for (var _i = 0; _i < arguments.length; _i++) {
  	            nodes[_i] = arguments[_i];
  	        }
  	        this.insertBefore(nodes[0], null);
  	        if (nodes.length > 1) {
  	            this.append.apply(this, nodes.slice(1));
  	        }
  	    };
  	    LinkedList.prototype.contains = function (node) {
  	        var cur, next = this.iterator();
  	        while ((cur = next())) {
  	            if (cur === node)
  	                return true;
  	        }
  	        return false;
  	    };
  	    LinkedList.prototype.insertBefore = function (node, refNode) {
  	        if (!node)
  	            return;
  	        node.next = refNode;
  	        if (refNode != null) {
  	            node.prev = refNode.prev;
  	            if (refNode.prev != null) {
  	                refNode.prev.next = node;
  	            }
  	            refNode.prev = node;
  	            if (refNode === this.head) {
  	                this.head = node;
  	            }
  	        }
  	        else if (this.tail != null) {
  	            this.tail.next = node;
  	            node.prev = this.tail;
  	            this.tail = node;
  	        }
  	        else {
  	            node.prev = null;
  	            this.head = this.tail = node;
  	        }
  	        this.length += 1;
  	    };
  	    LinkedList.prototype.offset = function (target) {
  	        var index = 0, cur = this.head;
  	        while (cur != null) {
  	            if (cur === target)
  	                return index;
  	            index += cur.length();
  	            cur = cur.next;
  	        }
  	        return -1;
  	    };
  	    LinkedList.prototype.remove = function (node) {
  	        if (!this.contains(node))
  	            return;
  	        if (node.prev != null)
  	            node.prev.next = node.next;
  	        if (node.next != null)
  	            node.next.prev = node.prev;
  	        if (node === this.head)
  	            this.head = node.next;
  	        if (node === this.tail)
  	            this.tail = node.prev;
  	        this.length -= 1;
  	    };
  	    LinkedList.prototype.iterator = function (curNode) {
  	        if (curNode === void 0) { curNode = this.head; }
  	        // TODO use yield when we can
  	        return function () {
  	            var ret = curNode;
  	            if (curNode != null)
  	                curNode = curNode.next;
  	            return ret;
  	        };
  	    };
  	    LinkedList.prototype.find = function (index, inclusive) {
  	        if (inclusive === void 0) { inclusive = false; }
  	        var cur, next = this.iterator();
  	        while ((cur = next())) {
  	            var length = cur.length();
  	            if (index < length ||
  	                (inclusive && index === length && (cur.next == null || cur.next.length() !== 0))) {
  	                return [cur, index];
  	            }
  	            index -= length;
  	        }
  	        return [null, 0];
  	    };
  	    LinkedList.prototype.forEach = function (callback) {
  	        var cur, next = this.iterator();
  	        while ((cur = next())) {
  	            callback(cur);
  	        }
  	    };
  	    LinkedList.prototype.forEachAt = function (index, length, callback) {
  	        if (length <= 0)
  	            return;
  	        var _a = this.find(index), startNode = _a[0], offset = _a[1];
  	        var cur, curIndex = index - offset, next = this.iterator(startNode);
  	        while ((cur = next()) && curIndex < index + length) {
  	            var curLength = cur.length();
  	            if (index > curIndex) {
  	                callback(cur, index - curIndex, Math.min(length, curIndex + curLength - index));
  	            }
  	            else {
  	                callback(cur, 0, Math.min(curLength, index + length - curIndex));
  	            }
  	            curIndex += curLength;
  	        }
  	    };
  	    LinkedList.prototype.map = function (callback) {
  	        return this.reduce(function (memo, cur) {
  	            memo.push(callback(cur));
  	            return memo;
  	        }, []);
  	    };
  	    LinkedList.prototype.reduce = function (callback, memo) {
  	        var cur, next = this.iterator();
  	        while ((cur = next())) {
  	            memo = callback(memo, cur);
  	        }
  	        return memo;
  	    };
  	    return LinkedList;
  	}());
  	exports.default = LinkedList;


  	/***/ }),
  	/* 45 */
  	/***/ (function(module, exports, __webpack_require__) {

  	var __extends = (this && this.__extends) || (function () {
  	    var extendStatics = Object.setPrototypeOf ||
  	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
  	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
  	    return function (d, b) {
  	        extendStatics(d, b);
  	        function __() { this.constructor = d; }
  	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  	    };
  	})();
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var container_1 = __webpack_require__(17);
  	var Registry = __webpack_require__(1);
  	var OBSERVER_CONFIG = {
  	    attributes: true,
  	    characterData: true,
  	    characterDataOldValue: true,
  	    childList: true,
  	    subtree: true,
  	};
  	var MAX_OPTIMIZE_ITERATIONS = 100;
  	var ScrollBlot = /** @class */ (function (_super) {
  	    __extends(ScrollBlot, _super);
  	    function ScrollBlot(node) {
  	        var _this = _super.call(this, node) || this;
  	        _this.scroll = _this;
  	        _this.observer = new MutationObserver(function (mutations) {
  	            _this.update(mutations);
  	        });
  	        _this.observer.observe(_this.domNode, OBSERVER_CONFIG);
  	        _this.attach();
  	        return _this;
  	    }
  	    ScrollBlot.prototype.detach = function () {
  	        _super.prototype.detach.call(this);
  	        this.observer.disconnect();
  	    };
  	    ScrollBlot.prototype.deleteAt = function (index, length) {
  	        this.update();
  	        if (index === 0 && length === this.length()) {
  	            this.children.forEach(function (child) {
  	                child.remove();
  	            });
  	        }
  	        else {
  	            _super.prototype.deleteAt.call(this, index, length);
  	        }
  	    };
  	    ScrollBlot.prototype.formatAt = function (index, length, name, value) {
  	        this.update();
  	        _super.prototype.formatAt.call(this, index, length, name, value);
  	    };
  	    ScrollBlot.prototype.insertAt = function (index, value, def) {
  	        this.update();
  	        _super.prototype.insertAt.call(this, index, value, def);
  	    };
  	    ScrollBlot.prototype.optimize = function (mutations, context) {
  	        var _this = this;
  	        if (mutations === void 0) { mutations = []; }
  	        if (context === void 0) { context = {}; }
  	        _super.prototype.optimize.call(this, context);
  	        // We must modify mutations directly, cannot make copy and then modify
  	        var records = [].slice.call(this.observer.takeRecords());
  	        // Array.push currently seems to be implemented by a non-tail recursive function
  	        // so we cannot just mutations.push.apply(mutations, this.observer.takeRecords());
  	        while (records.length > 0)
  	            mutations.push(records.pop());
  	        // TODO use WeakMap
  	        var mark = function (blot, markParent) {
  	            if (markParent === void 0) { markParent = true; }
  	            if (blot == null || blot === _this)
  	                return;
  	            if (blot.domNode.parentNode == null)
  	                return;
  	            // @ts-ignore
  	            if (blot.domNode[Registry.DATA_KEY].mutations == null) {
  	                // @ts-ignore
  	                blot.domNode[Registry.DATA_KEY].mutations = [];
  	            }
  	            if (markParent)
  	                mark(blot.parent);
  	        };
  	        var optimize = function (blot) {
  	            // Post-order traversal
  	            if (
  	            // @ts-ignore
  	            blot.domNode[Registry.DATA_KEY] == null ||
  	                // @ts-ignore
  	                blot.domNode[Registry.DATA_KEY].mutations == null) {
  	                return;
  	            }
  	            if (blot instanceof container_1.default) {
  	                blot.children.forEach(optimize);
  	            }
  	            blot.optimize(context);
  	        };
  	        var remaining = mutations;
  	        for (var i = 0; remaining.length > 0; i += 1) {
  	            if (i >= MAX_OPTIMIZE_ITERATIONS) {
  	                throw new Error('[Parchment] Maximum optimize iterations reached');
  	            }
  	            remaining.forEach(function (mutation) {
  	                var blot = Registry.find(mutation.target, true);
  	                if (blot == null)
  	                    return;
  	                if (blot.domNode === mutation.target) {
  	                    if (mutation.type === 'childList') {
  	                        mark(Registry.find(mutation.previousSibling, false));
  	                        [].forEach.call(mutation.addedNodes, function (node) {
  	                            var child = Registry.find(node, false);
  	                            mark(child, false);
  	                            if (child instanceof container_1.default) {
  	                                child.children.forEach(function (grandChild) {
  	                                    mark(grandChild, false);
  	                                });
  	                            }
  	                        });
  	                    }
  	                    else if (mutation.type === 'attributes') {
  	                        mark(blot.prev);
  	                    }
  	                }
  	                mark(blot);
  	            });
  	            this.children.forEach(optimize);
  	            remaining = [].slice.call(this.observer.takeRecords());
  	            records = remaining.slice();
  	            while (records.length > 0)
  	                mutations.push(records.pop());
  	        }
  	    };
  	    ScrollBlot.prototype.update = function (mutations, context) {
  	        var _this = this;
  	        if (context === void 0) { context = {}; }
  	        mutations = mutations || this.observer.takeRecords();
  	        // TODO use WeakMap
  	        mutations
  	            .map(function (mutation) {
  	            var blot = Registry.find(mutation.target, true);
  	            if (blot == null)
  	                return null;
  	            // @ts-ignore
  	            if (blot.domNode[Registry.DATA_KEY].mutations == null) {
  	                // @ts-ignore
  	                blot.domNode[Registry.DATA_KEY].mutations = [mutation];
  	                return blot;
  	            }
  	            else {
  	                // @ts-ignore
  	                blot.domNode[Registry.DATA_KEY].mutations.push(mutation);
  	                return null;
  	            }
  	        })
  	            .forEach(function (blot) {
  	            if (blot == null ||
  	                blot === _this ||
  	                //@ts-ignore
  	                blot.domNode[Registry.DATA_KEY] == null)
  	                return;
  	            // @ts-ignore
  	            blot.update(blot.domNode[Registry.DATA_KEY].mutations || [], context);
  	        });
  	        // @ts-ignore
  	        if (this.domNode[Registry.DATA_KEY].mutations != null) {
  	            // @ts-ignore
  	            _super.prototype.update.call(this, this.domNode[Registry.DATA_KEY].mutations, context);
  	        }
  	        this.optimize(mutations, context);
  	    };
  	    ScrollBlot.blotName = 'scroll';
  	    ScrollBlot.defaultChild = 'block';
  	    ScrollBlot.scope = Registry.Scope.BLOCK_BLOT;
  	    ScrollBlot.tagName = 'DIV';
  	    return ScrollBlot;
  	}(container_1.default));
  	exports.default = ScrollBlot;


  	/***/ }),
  	/* 46 */
  	/***/ (function(module, exports, __webpack_require__) {

  	var __extends = (this && this.__extends) || (function () {
  	    var extendStatics = Object.setPrototypeOf ||
  	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
  	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
  	    return function (d, b) {
  	        extendStatics(d, b);
  	        function __() { this.constructor = d; }
  	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  	    };
  	})();
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var format_1 = __webpack_require__(18);
  	var Registry = __webpack_require__(1);
  	// Shallow object comparison
  	function isEqual(obj1, obj2) {
  	    if (Object.keys(obj1).length !== Object.keys(obj2).length)
  	        return false;
  	    // @ts-ignore
  	    for (var prop in obj1) {
  	        // @ts-ignore
  	        if (obj1[prop] !== obj2[prop])
  	            return false;
  	    }
  	    return true;
  	}
  	var InlineBlot = /** @class */ (function (_super) {
  	    __extends(InlineBlot, _super);
  	    function InlineBlot() {
  	        return _super !== null && _super.apply(this, arguments) || this;
  	    }
  	    InlineBlot.formats = function (domNode) {
  	        if (domNode.tagName === InlineBlot.tagName)
  	            return undefined;
  	        return _super.formats.call(this, domNode);
  	    };
  	    InlineBlot.prototype.format = function (name, value) {
  	        var _this = this;
  	        if (name === this.statics.blotName && !value) {
  	            this.children.forEach(function (child) {
  	                if (!(child instanceof format_1.default)) {
  	                    child = child.wrap(InlineBlot.blotName, true);
  	                }
  	                _this.attributes.copy(child);
  	            });
  	            this.unwrap();
  	        }
  	        else {
  	            _super.prototype.format.call(this, name, value);
  	        }
  	    };
  	    InlineBlot.prototype.formatAt = function (index, length, name, value) {
  	        if (this.formats()[name] != null || Registry.query(name, Registry.Scope.ATTRIBUTE)) {
  	            var blot = this.isolate(index, length);
  	            blot.format(name, value);
  	        }
  	        else {
  	            _super.prototype.formatAt.call(this, index, length, name, value);
  	        }
  	    };
  	    InlineBlot.prototype.optimize = function (context) {
  	        _super.prototype.optimize.call(this, context);
  	        var formats = this.formats();
  	        if (Object.keys(formats).length === 0) {
  	            return this.unwrap(); // unformatted span
  	        }
  	        var next = this.next;
  	        if (next instanceof InlineBlot && next.prev === this && isEqual(formats, next.formats())) {
  	            next.moveChildren(this);
  	            next.remove();
  	        }
  	    };
  	    InlineBlot.blotName = 'inline';
  	    InlineBlot.scope = Registry.Scope.INLINE_BLOT;
  	    InlineBlot.tagName = 'SPAN';
  	    return InlineBlot;
  	}(format_1.default));
  	exports.default = InlineBlot;


  	/***/ }),
  	/* 47 */
  	/***/ (function(module, exports, __webpack_require__) {

  	var __extends = (this && this.__extends) || (function () {
  	    var extendStatics = Object.setPrototypeOf ||
  	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
  	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
  	    return function (d, b) {
  	        extendStatics(d, b);
  	        function __() { this.constructor = d; }
  	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  	    };
  	})();
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var format_1 = __webpack_require__(18);
  	var Registry = __webpack_require__(1);
  	var BlockBlot = /** @class */ (function (_super) {
  	    __extends(BlockBlot, _super);
  	    function BlockBlot() {
  	        return _super !== null && _super.apply(this, arguments) || this;
  	    }
  	    BlockBlot.formats = function (domNode) {
  	        var tagName = Registry.query(BlockBlot.blotName).tagName;
  	        if (domNode.tagName === tagName)
  	            return undefined;
  	        return _super.formats.call(this, domNode);
  	    };
  	    BlockBlot.prototype.format = function (name, value) {
  	        if (Registry.query(name, Registry.Scope.BLOCK) == null) {
  	            return;
  	        }
  	        else if (name === this.statics.blotName && !value) {
  	            this.replaceWith(BlockBlot.blotName);
  	        }
  	        else {
  	            _super.prototype.format.call(this, name, value);
  	        }
  	    };
  	    BlockBlot.prototype.formatAt = function (index, length, name, value) {
  	        if (Registry.query(name, Registry.Scope.BLOCK) != null) {
  	            this.format(name, value);
  	        }
  	        else {
  	            _super.prototype.formatAt.call(this, index, length, name, value);
  	        }
  	    };
  	    BlockBlot.prototype.insertAt = function (index, value, def) {
  	        if (def == null || Registry.query(value, Registry.Scope.INLINE) != null) {
  	            // Insert text or inline
  	            _super.prototype.insertAt.call(this, index, value, def);
  	        }
  	        else {
  	            var after = this.split(index);
  	            var blot = Registry.create(value, def);
  	            after.parent.insertBefore(blot, after);
  	        }
  	    };
  	    BlockBlot.prototype.update = function (mutations, context) {
  	        if (navigator.userAgent.match(/Trident/)) {
  	            this.build();
  	        }
  	        else {
  	            _super.prototype.update.call(this, mutations, context);
  	        }
  	    };
  	    BlockBlot.blotName = 'block';
  	    BlockBlot.scope = Registry.Scope.BLOCK_BLOT;
  	    BlockBlot.tagName = 'P';
  	    return BlockBlot;
  	}(format_1.default));
  	exports.default = BlockBlot;


  	/***/ }),
  	/* 48 */
  	/***/ (function(module, exports, __webpack_require__) {

  	var __extends = (this && this.__extends) || (function () {
  	    var extendStatics = Object.setPrototypeOf ||
  	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
  	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
  	    return function (d, b) {
  	        extendStatics(d, b);
  	        function __() { this.constructor = d; }
  	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  	    };
  	})();
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var leaf_1 = __webpack_require__(19);
  	var EmbedBlot = /** @class */ (function (_super) {
  	    __extends(EmbedBlot, _super);
  	    function EmbedBlot() {
  	        return _super !== null && _super.apply(this, arguments) || this;
  	    }
  	    EmbedBlot.formats = function (domNode) {
  	        return undefined;
  	    };
  	    EmbedBlot.prototype.format = function (name, value) {
  	        // super.formatAt wraps, which is what we want in general,
  	        // but this allows subclasses to overwrite for formats
  	        // that just apply to particular embeds
  	        _super.prototype.formatAt.call(this, 0, this.length(), name, value);
  	    };
  	    EmbedBlot.prototype.formatAt = function (index, length, name, value) {
  	        if (index === 0 && length === this.length()) {
  	            this.format(name, value);
  	        }
  	        else {
  	            _super.prototype.formatAt.call(this, index, length, name, value);
  	        }
  	    };
  	    EmbedBlot.prototype.formats = function () {
  	        return this.statics.formats(this.domNode);
  	    };
  	    return EmbedBlot;
  	}(leaf_1.default));
  	exports.default = EmbedBlot;


  	/***/ }),
  	/* 49 */
  	/***/ (function(module, exports, __webpack_require__) {

  	var __extends = (this && this.__extends) || (function () {
  	    var extendStatics = Object.setPrototypeOf ||
  	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
  	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
  	    return function (d, b) {
  	        extendStatics(d, b);
  	        function __() { this.constructor = d; }
  	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  	    };
  	})();
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var leaf_1 = __webpack_require__(19);
  	var Registry = __webpack_require__(1);
  	var TextBlot = /** @class */ (function (_super) {
  	    __extends(TextBlot, _super);
  	    function TextBlot(node) {
  	        var _this = _super.call(this, node) || this;
  	        _this.text = _this.statics.value(_this.domNode);
  	        return _this;
  	    }
  	    TextBlot.create = function (value) {
  	        return document.createTextNode(value);
  	    };
  	    TextBlot.value = function (domNode) {
  	        var text = domNode.data;
  	        // @ts-ignore
  	        if (text['normalize'])
  	            text = text['normalize']();
  	        return text;
  	    };
  	    TextBlot.prototype.deleteAt = function (index, length) {
  	        this.domNode.data = this.text = this.text.slice(0, index) + this.text.slice(index + length);
  	    };
  	    TextBlot.prototype.index = function (node, offset) {
  	        if (this.domNode === node) {
  	            return offset;
  	        }
  	        return -1;
  	    };
  	    TextBlot.prototype.insertAt = function (index, value, def) {
  	        if (def == null) {
  	            this.text = this.text.slice(0, index) + value + this.text.slice(index);
  	            this.domNode.data = this.text;
  	        }
  	        else {
  	            _super.prototype.insertAt.call(this, index, value, def);
  	        }
  	    };
  	    TextBlot.prototype.length = function () {
  	        return this.text.length;
  	    };
  	    TextBlot.prototype.optimize = function (context) {
  	        _super.prototype.optimize.call(this, context);
  	        this.text = this.statics.value(this.domNode);
  	        if (this.text.length === 0) {
  	            this.remove();
  	        }
  	        else if (this.next instanceof TextBlot && this.next.prev === this) {
  	            this.insertAt(this.length(), this.next.value());
  	            this.next.remove();
  	        }
  	    };
  	    TextBlot.prototype.position = function (index, inclusive) {
  	        return [this.domNode, index];
  	    };
  	    TextBlot.prototype.split = function (index, force) {
  	        if (force === void 0) { force = false; }
  	        if (!force) {
  	            if (index === 0)
  	                return this;
  	            if (index === this.length())
  	                return this.next;
  	        }
  	        var after = Registry.create(this.domNode.splitText(index));
  	        this.parent.insertBefore(after, this.next);
  	        this.text = this.statics.value(this.domNode);
  	        return after;
  	    };
  	    TextBlot.prototype.update = function (mutations, context) {
  	        var _this = this;
  	        if (mutations.some(function (mutation) {
  	            return mutation.type === 'characterData' && mutation.target === _this.domNode;
  	        })) {
  	            this.text = this.statics.value(this.domNode);
  	        }
  	    };
  	    TextBlot.prototype.value = function () {
  	        return this.text;
  	    };
  	    TextBlot.blotName = 'text';
  	    TextBlot.scope = Registry.Scope.INLINE_BLOT;
  	    return TextBlot;
  	}(leaf_1.default));
  	exports.default = TextBlot;


  	/***/ }),
  	/* 50 */
  	/***/ (function(module, exports, __webpack_require__) {


  	var elem = document.createElement('div');
  	elem.classList.toggle('test-class', false);
  	if (elem.classList.contains('test-class')) {
  	  var _toggle = DOMTokenList.prototype.toggle;
  	  DOMTokenList.prototype.toggle = function (token, force) {
  	    if (arguments.length > 1 && !this.contains(token) === !force) {
  	      return force;
  	    } else {
  	      return _toggle.call(this, token);
  	    }
  	  };
  	}

  	if (!String.prototype.startsWith) {
  	  String.prototype.startsWith = function (searchString, position) {
  	    position = position || 0;
  	    return this.substr(position, searchString.length) === searchString;
  	  };
  	}

  	if (!String.prototype.endsWith) {
  	  String.prototype.endsWith = function (searchString, position) {
  	    var subjectString = this.toString();
  	    if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
  	      position = subjectString.length;
  	    }
  	    position -= searchString.length;
  	    var lastIndex = subjectString.indexOf(searchString, position);
  	    return lastIndex !== -1 && lastIndex === position;
  	  };
  	}

  	if (!Array.prototype.find) {
  	  Object.defineProperty(Array.prototype, "find", {
  	    value: function value(predicate) {
  	      if (this === null) {
  	        throw new TypeError('Array.prototype.find called on null or undefined');
  	      }
  	      if (typeof predicate !== 'function') {
  	        throw new TypeError('predicate must be a function');
  	      }
  	      var list = Object(this);
  	      var length = list.length >>> 0;
  	      var thisArg = arguments[1];
  	      var value;

  	      for (var i = 0; i < length; i++) {
  	        value = list[i];
  	        if (predicate.call(thisArg, value, i, list)) {
  	          return value;
  	        }
  	      }
  	      return undefined;
  	    }
  	  });
  	}

  	document.addEventListener("DOMContentLoaded", function () {
  	  // Disable resizing in Firefox
  	  document.execCommand("enableObjectResizing", false, false);
  	  // Disable automatic linkifying in IE11
  	  document.execCommand("autoUrlDetect", false, false);
  	});

  	/***/ }),
  	/* 51 */
  	/***/ (function(module, exports) {

  	/**
  	 * This library modifies the diff-patch-match library by Neil Fraser
  	 * by removing the patch and match functionality and certain advanced
  	 * options in the diff function. The original license is as follows:
  	 *
  	 * ===
  	 *
  	 * Diff Match and Patch
  	 *
  	 * Copyright 2006 Google Inc.
  	 * http://code.google.com/p/google-diff-match-patch/
  	 *
  	 * Licensed under the Apache License, Version 2.0 (the "License");
  	 * you may not use this file except in compliance with the License.
  	 * You may obtain a copy of the License at
  	 *
  	 *   http://www.apache.org/licenses/LICENSE-2.0
  	 *
  	 * Unless required by applicable law or agreed to in writing, software
  	 * distributed under the License is distributed on an "AS IS" BASIS,
  	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  	 * See the License for the specific language governing permissions and
  	 * limitations under the License.
  	 */


  	/**
  	 * The data structure representing a diff is an array of tuples:
  	 * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
  	 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
  	 */
  	var DIFF_DELETE = -1;
  	var DIFF_INSERT = 1;
  	var DIFF_EQUAL = 0;


  	/**
  	 * Find the differences between two texts.  Simplifies the problem by stripping
  	 * any common prefix or suffix off the texts before diffing.
  	 * @param {string} text1 Old string to be diffed.
  	 * @param {string} text2 New string to be diffed.
  	 * @param {Int} cursor_pos Expected edit position in text1 (optional)
  	 * @return {Array} Array of diff tuples.
  	 */
  	function diff_main(text1, text2, cursor_pos) {
  	  // Check for equality (speedup).
  	  if (text1 == text2) {
  	    if (text1) {
  	      return [[DIFF_EQUAL, text1]];
  	    }
  	    return [];
  	  }

  	  // Check cursor_pos within bounds
  	  if (cursor_pos < 0 || text1.length < cursor_pos) {
  	    cursor_pos = null;
  	  }

  	  // Trim off common prefix (speedup).
  	  var commonlength = diff_commonPrefix(text1, text2);
  	  var commonprefix = text1.substring(0, commonlength);
  	  text1 = text1.substring(commonlength);
  	  text2 = text2.substring(commonlength);

  	  // Trim off common suffix (speedup).
  	  commonlength = diff_commonSuffix(text1, text2);
  	  var commonsuffix = text1.substring(text1.length - commonlength);
  	  text1 = text1.substring(0, text1.length - commonlength);
  	  text2 = text2.substring(0, text2.length - commonlength);

  	  // Compute the diff on the middle block.
  	  var diffs = diff_compute_(text1, text2);

  	  // Restore the prefix and suffix.
  	  if (commonprefix) {
  	    diffs.unshift([DIFF_EQUAL, commonprefix]);
  	  }
  	  if (commonsuffix) {
  	    diffs.push([DIFF_EQUAL, commonsuffix]);
  	  }
  	  diff_cleanupMerge(diffs);
  	  if (cursor_pos != null) {
  	    diffs = fix_cursor(diffs, cursor_pos);
  	  }
  	  diffs = fix_emoji(diffs);
  	  return diffs;
  	}

  	/**
  	 * Find the differences between two texts.  Assumes that the texts do not
  	 * have any common prefix or suffix.
  	 * @param {string} text1 Old string to be diffed.
  	 * @param {string} text2 New string to be diffed.
  	 * @return {Array} Array of diff tuples.
  	 */
  	function diff_compute_(text1, text2) {
  	  var diffs;

  	  if (!text1) {
  	    // Just add some text (speedup).
  	    return [[DIFF_INSERT, text2]];
  	  }

  	  if (!text2) {
  	    // Just delete some text (speedup).
  	    return [[DIFF_DELETE, text1]];
  	  }

  	  var longtext = text1.length > text2.length ? text1 : text2;
  	  var shorttext = text1.length > text2.length ? text2 : text1;
  	  var i = longtext.indexOf(shorttext);
  	  if (i != -1) {
  	    // Shorter text is inside the longer text (speedup).
  	    diffs = [[DIFF_INSERT, longtext.substring(0, i)],
  	             [DIFF_EQUAL, shorttext],
  	             [DIFF_INSERT, longtext.substring(i + shorttext.length)]];
  	    // Swap insertions for deletions if diff is reversed.
  	    if (text1.length > text2.length) {
  	      diffs[0][0] = diffs[2][0] = DIFF_DELETE;
  	    }
  	    return diffs;
  	  }

  	  if (shorttext.length == 1) {
  	    // Single character string.
  	    // After the previous speedup, the character can't be an equality.
  	    return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
  	  }

  	  // Check to see if the problem can be split in two.
  	  var hm = diff_halfMatch_(text1, text2);
  	  if (hm) {
  	    // A half-match was found, sort out the return data.
  	    var text1_a = hm[0];
  	    var text1_b = hm[1];
  	    var text2_a = hm[2];
  	    var text2_b = hm[3];
  	    var mid_common = hm[4];
  	    // Send both pairs off for separate processing.
  	    var diffs_a = diff_main(text1_a, text2_a);
  	    var diffs_b = diff_main(text1_b, text2_b);
  	    // Merge the results.
  	    return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
  	  }

  	  return diff_bisect_(text1, text2);
  	}

  	/**
  	 * Find the 'middle snake' of a diff, split the problem in two
  	 * and return the recursively constructed diff.
  	 * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
  	 * @param {string} text1 Old string to be diffed.
  	 * @param {string} text2 New string to be diffed.
  	 * @return {Array} Array of diff tuples.
  	 * @private
  	 */
  	function diff_bisect_(text1, text2) {
  	  // Cache the text lengths to prevent multiple calls.
  	  var text1_length = text1.length;
  	  var text2_length = text2.length;
  	  var max_d = Math.ceil((text1_length + text2_length) / 2);
  	  var v_offset = max_d;
  	  var v_length = 2 * max_d;
  	  var v1 = new Array(v_length);
  	  var v2 = new Array(v_length);
  	  // Setting all elements to -1 is faster in Chrome & Firefox than mixing
  	  // integers and undefined.
  	  for (var x = 0; x < v_length; x++) {
  	    v1[x] = -1;
  	    v2[x] = -1;
  	  }
  	  v1[v_offset + 1] = 0;
  	  v2[v_offset + 1] = 0;
  	  var delta = text1_length - text2_length;
  	  // If the total number of characters is odd, then the front path will collide
  	  // with the reverse path.
  	  var front = (delta % 2 != 0);
  	  // Offsets for start and end of k loop.
  	  // Prevents mapping of space beyond the grid.
  	  var k1start = 0;
  	  var k1end = 0;
  	  var k2start = 0;
  	  var k2end = 0;
  	  for (var d = 0; d < max_d; d++) {
  	    // Walk the front path one step.
  	    for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
  	      var k1_offset = v_offset + k1;
  	      var x1;
  	      if (k1 == -d || (k1 != d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
  	        x1 = v1[k1_offset + 1];
  	      } else {
  	        x1 = v1[k1_offset - 1] + 1;
  	      }
  	      var y1 = x1 - k1;
  	      while (x1 < text1_length && y1 < text2_length &&
  	             text1.charAt(x1) == text2.charAt(y1)) {
  	        x1++;
  	        y1++;
  	      }
  	      v1[k1_offset] = x1;
  	      if (x1 > text1_length) {
  	        // Ran off the right of the graph.
  	        k1end += 2;
  	      } else if (y1 > text2_length) {
  	        // Ran off the bottom of the graph.
  	        k1start += 2;
  	      } else if (front) {
  	        var k2_offset = v_offset + delta - k1;
  	        if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] != -1) {
  	          // Mirror x2 onto top-left coordinate system.
  	          var x2 = text1_length - v2[k2_offset];
  	          if (x1 >= x2) {
  	            // Overlap detected.
  	            return diff_bisectSplit_(text1, text2, x1, y1);
  	          }
  	        }
  	      }
  	    }

  	    // Walk the reverse path one step.
  	    for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
  	      var k2_offset = v_offset + k2;
  	      var x2;
  	      if (k2 == -d || (k2 != d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
  	        x2 = v2[k2_offset + 1];
  	      } else {
  	        x2 = v2[k2_offset - 1] + 1;
  	      }
  	      var y2 = x2 - k2;
  	      while (x2 < text1_length && y2 < text2_length &&
  	             text1.charAt(text1_length - x2 - 1) ==
  	             text2.charAt(text2_length - y2 - 1)) {
  	        x2++;
  	        y2++;
  	      }
  	      v2[k2_offset] = x2;
  	      if (x2 > text1_length) {
  	        // Ran off the left of the graph.
  	        k2end += 2;
  	      } else if (y2 > text2_length) {
  	        // Ran off the top of the graph.
  	        k2start += 2;
  	      } else if (!front) {
  	        var k1_offset = v_offset + delta - k2;
  	        if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] != -1) {
  	          var x1 = v1[k1_offset];
  	          var y1 = v_offset + x1 - k1_offset;
  	          // Mirror x2 onto top-left coordinate system.
  	          x2 = text1_length - x2;
  	          if (x1 >= x2) {
  	            // Overlap detected.
  	            return diff_bisectSplit_(text1, text2, x1, y1);
  	          }
  	        }
  	      }
  	    }
  	  }
  	  // Diff took too long and hit the deadline or
  	  // number of diffs equals number of characters, no commonality at all.
  	  return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
  	}

  	/**
  	 * Given the location of the 'middle snake', split the diff in two parts
  	 * and recurse.
  	 * @param {string} text1 Old string to be diffed.
  	 * @param {string} text2 New string to be diffed.
  	 * @param {number} x Index of split point in text1.
  	 * @param {number} y Index of split point in text2.
  	 * @return {Array} Array of diff tuples.
  	 */
  	function diff_bisectSplit_(text1, text2, x, y) {
  	  var text1a = text1.substring(0, x);
  	  var text2a = text2.substring(0, y);
  	  var text1b = text1.substring(x);
  	  var text2b = text2.substring(y);

  	  // Compute both diffs serially.
  	  var diffs = diff_main(text1a, text2a);
  	  var diffsb = diff_main(text1b, text2b);

  	  return diffs.concat(diffsb);
  	}

  	/**
  	 * Determine the common prefix of two strings.
  	 * @param {string} text1 First string.
  	 * @param {string} text2 Second string.
  	 * @return {number} The number of characters common to the start of each
  	 *     string.
  	 */
  	function diff_commonPrefix(text1, text2) {
  	  // Quick check for common null cases.
  	  if (!text1 || !text2 || text1.charAt(0) != text2.charAt(0)) {
  	    return 0;
  	  }
  	  // Binary search.
  	  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  	  var pointermin = 0;
  	  var pointermax = Math.min(text1.length, text2.length);
  	  var pointermid = pointermax;
  	  var pointerstart = 0;
  	  while (pointermin < pointermid) {
  	    if (text1.substring(pointerstart, pointermid) ==
  	        text2.substring(pointerstart, pointermid)) {
  	      pointermin = pointermid;
  	      pointerstart = pointermin;
  	    } else {
  	      pointermax = pointermid;
  	    }
  	    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  	  }
  	  return pointermid;
  	}

  	/**
  	 * Determine the common suffix of two strings.
  	 * @param {string} text1 First string.
  	 * @param {string} text2 Second string.
  	 * @return {number} The number of characters common to the end of each string.
  	 */
  	function diff_commonSuffix(text1, text2) {
  	  // Quick check for common null cases.
  	  if (!text1 || !text2 ||
  	      text1.charAt(text1.length - 1) != text2.charAt(text2.length - 1)) {
  	    return 0;
  	  }
  	  // Binary search.
  	  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  	  var pointermin = 0;
  	  var pointermax = Math.min(text1.length, text2.length);
  	  var pointermid = pointermax;
  	  var pointerend = 0;
  	  while (pointermin < pointermid) {
  	    if (text1.substring(text1.length - pointermid, text1.length - pointerend) ==
  	        text2.substring(text2.length - pointermid, text2.length - pointerend)) {
  	      pointermin = pointermid;
  	      pointerend = pointermin;
  	    } else {
  	      pointermax = pointermid;
  	    }
  	    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  	  }
  	  return pointermid;
  	}

  	/**
  	 * Do the two texts share a substring which is at least half the length of the
  	 * longer text?
  	 * This speedup can produce non-minimal diffs.
  	 * @param {string} text1 First string.
  	 * @param {string} text2 Second string.
  	 * @return {Array.<string>} Five element Array, containing the prefix of
  	 *     text1, the suffix of text1, the prefix of text2, the suffix of
  	 *     text2 and the common middle.  Or null if there was no match.
  	 */
  	function diff_halfMatch_(text1, text2) {
  	  var longtext = text1.length > text2.length ? text1 : text2;
  	  var shorttext = text1.length > text2.length ? text2 : text1;
  	  if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
  	    return null;  // Pointless.
  	  }

  	  /**
  	   * Does a substring of shorttext exist within longtext such that the substring
  	   * is at least half the length of longtext?
  	   * Closure, but does not reference any external variables.
  	   * @param {string} longtext Longer string.
  	   * @param {string} shorttext Shorter string.
  	   * @param {number} i Start index of quarter length substring within longtext.
  	   * @return {Array.<string>} Five element Array, containing the prefix of
  	   *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
  	   *     of shorttext and the common middle.  Or null if there was no match.
  	   * @private
  	   */
  	  function diff_halfMatchI_(longtext, shorttext, i) {
  	    // Start with a 1/4 length substring at position i as a seed.
  	    var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
  	    var j = -1;
  	    var best_common = '';
  	    var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
  	    while ((j = shorttext.indexOf(seed, j + 1)) != -1) {
  	      var prefixLength = diff_commonPrefix(longtext.substring(i),
  	                                           shorttext.substring(j));
  	      var suffixLength = diff_commonSuffix(longtext.substring(0, i),
  	                                           shorttext.substring(0, j));
  	      if (best_common.length < suffixLength + prefixLength) {
  	        best_common = shorttext.substring(j - suffixLength, j) +
  	            shorttext.substring(j, j + prefixLength);
  	        best_longtext_a = longtext.substring(0, i - suffixLength);
  	        best_longtext_b = longtext.substring(i + prefixLength);
  	        best_shorttext_a = shorttext.substring(0, j - suffixLength);
  	        best_shorttext_b = shorttext.substring(j + prefixLength);
  	      }
  	    }
  	    if (best_common.length * 2 >= longtext.length) {
  	      return [best_longtext_a, best_longtext_b,
  	              best_shorttext_a, best_shorttext_b, best_common];
  	    } else {
  	      return null;
  	    }
  	  }

  	  // First check if the second quarter is the seed for a half-match.
  	  var hm1 = diff_halfMatchI_(longtext, shorttext,
  	                             Math.ceil(longtext.length / 4));
  	  // Check again based on the third quarter.
  	  var hm2 = diff_halfMatchI_(longtext, shorttext,
  	                             Math.ceil(longtext.length / 2));
  	  var hm;
  	  if (!hm1 && !hm2) {
  	    return null;
  	  } else if (!hm2) {
  	    hm = hm1;
  	  } else if (!hm1) {
  	    hm = hm2;
  	  } else {
  	    // Both matched.  Select the longest.
  	    hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
  	  }

  	  // A half-match was found, sort out the return data.
  	  var text1_a, text1_b, text2_a, text2_b;
  	  if (text1.length > text2.length) {
  	    text1_a = hm[0];
  	    text1_b = hm[1];
  	    text2_a = hm[2];
  	    text2_b = hm[3];
  	  } else {
  	    text2_a = hm[0];
  	    text2_b = hm[1];
  	    text1_a = hm[2];
  	    text1_b = hm[3];
  	  }
  	  var mid_common = hm[4];
  	  return [text1_a, text1_b, text2_a, text2_b, mid_common];
  	}

  	/**
  	 * Reorder and merge like edit sections.  Merge equalities.
  	 * Any edit section can move as long as it doesn't cross an equality.
  	 * @param {Array} diffs Array of diff tuples.
  	 */
  	function diff_cleanupMerge(diffs) {
  	  diffs.push([DIFF_EQUAL, '']);  // Add a dummy entry at the end.
  	  var pointer = 0;
  	  var count_delete = 0;
  	  var count_insert = 0;
  	  var text_delete = '';
  	  var text_insert = '';
  	  var commonlength;
  	  while (pointer < diffs.length) {
  	    switch (diffs[pointer][0]) {
  	      case DIFF_INSERT:
  	        count_insert++;
  	        text_insert += diffs[pointer][1];
  	        pointer++;
  	        break;
  	      case DIFF_DELETE:
  	        count_delete++;
  	        text_delete += diffs[pointer][1];
  	        pointer++;
  	        break;
  	      case DIFF_EQUAL:
  	        // Upon reaching an equality, check for prior redundancies.
  	        if (count_delete + count_insert > 1) {
  	          if (count_delete !== 0 && count_insert !== 0) {
  	            // Factor out any common prefixies.
  	            commonlength = diff_commonPrefix(text_insert, text_delete);
  	            if (commonlength !== 0) {
  	              if ((pointer - count_delete - count_insert) > 0 &&
  	                  diffs[pointer - count_delete - count_insert - 1][0] ==
  	                  DIFF_EQUAL) {
  	                diffs[pointer - count_delete - count_insert - 1][1] +=
  	                    text_insert.substring(0, commonlength);
  	              } else {
  	                diffs.splice(0, 0, [DIFF_EQUAL,
  	                                    text_insert.substring(0, commonlength)]);
  	                pointer++;
  	              }
  	              text_insert = text_insert.substring(commonlength);
  	              text_delete = text_delete.substring(commonlength);
  	            }
  	            // Factor out any common suffixies.
  	            commonlength = diff_commonSuffix(text_insert, text_delete);
  	            if (commonlength !== 0) {
  	              diffs[pointer][1] = text_insert.substring(text_insert.length -
  	                  commonlength) + diffs[pointer][1];
  	              text_insert = text_insert.substring(0, text_insert.length -
  	                  commonlength);
  	              text_delete = text_delete.substring(0, text_delete.length -
  	                  commonlength);
  	            }
  	          }
  	          // Delete the offending records and add the merged ones.
  	          if (count_delete === 0) {
  	            diffs.splice(pointer - count_insert,
  	                count_delete + count_insert, [DIFF_INSERT, text_insert]);
  	          } else if (count_insert === 0) {
  	            diffs.splice(pointer - count_delete,
  	                count_delete + count_insert, [DIFF_DELETE, text_delete]);
  	          } else {
  	            diffs.splice(pointer - count_delete - count_insert,
  	                count_delete + count_insert, [DIFF_DELETE, text_delete],
  	                [DIFF_INSERT, text_insert]);
  	          }
  	          pointer = pointer - count_delete - count_insert +
  	                    (count_delete ? 1 : 0) + (count_insert ? 1 : 0) + 1;
  	        } else if (pointer !== 0 && diffs[pointer - 1][0] == DIFF_EQUAL) {
  	          // Merge this equality with the previous one.
  	          diffs[pointer - 1][1] += diffs[pointer][1];
  	          diffs.splice(pointer, 1);
  	        } else {
  	          pointer++;
  	        }
  	        count_insert = 0;
  	        count_delete = 0;
  	        text_delete = '';
  	        text_insert = '';
  	        break;
  	    }
  	  }
  	  if (diffs[diffs.length - 1][1] === '') {
  	    diffs.pop();  // Remove the dummy entry at the end.
  	  }

  	  // Second pass: look for single edits surrounded on both sides by equalities
  	  // which can be shifted sideways to eliminate an equality.
  	  // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
  	  var changes = false;
  	  pointer = 1;
  	  // Intentionally ignore the first and last element (don't need checking).
  	  while (pointer < diffs.length - 1) {
  	    if (diffs[pointer - 1][0] == DIFF_EQUAL &&
  	        diffs[pointer + 1][0] == DIFF_EQUAL) {
  	      // This is a single edit surrounded by equalities.
  	      if (diffs[pointer][1].substring(diffs[pointer][1].length -
  	          diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
  	        // Shift the edit over the previous equality.
  	        diffs[pointer][1] = diffs[pointer - 1][1] +
  	            diffs[pointer][1].substring(0, diffs[pointer][1].length -
  	                                        diffs[pointer - 1][1].length);
  	        diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
  	        diffs.splice(pointer - 1, 1);
  	        changes = true;
  	      } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
  	          diffs[pointer + 1][1]) {
  	        // Shift the edit over the next equality.
  	        diffs[pointer - 1][1] += diffs[pointer + 1][1];
  	        diffs[pointer][1] =
  	            diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
  	            diffs[pointer + 1][1];
  	        diffs.splice(pointer + 1, 1);
  	        changes = true;
  	      }
  	    }
  	    pointer++;
  	  }
  	  // If shifts were made, the diff needs reordering and another shift sweep.
  	  if (changes) {
  	    diff_cleanupMerge(diffs);
  	  }
  	}

  	var diff = diff_main;
  	diff.INSERT = DIFF_INSERT;
  	diff.DELETE = DIFF_DELETE;
  	diff.EQUAL = DIFF_EQUAL;

  	module.exports = diff;

  	/*
  	 * Modify a diff such that the cursor position points to the start of a change:
  	 * E.g.
  	 *   cursor_normalize_diff([[DIFF_EQUAL, 'abc']], 1)
  	 *     => [1, [[DIFF_EQUAL, 'a'], [DIFF_EQUAL, 'bc']]]
  	 *   cursor_normalize_diff([[DIFF_INSERT, 'new'], [DIFF_DELETE, 'xyz']], 2)
  	 *     => [2, [[DIFF_INSERT, 'new'], [DIFF_DELETE, 'xy'], [DIFF_DELETE, 'z']]]
  	 *
  	 * @param {Array} diffs Array of diff tuples
  	 * @param {Int} cursor_pos Suggested edit position. Must not be out of bounds!
  	 * @return {Array} A tuple [cursor location in the modified diff, modified diff]
  	 */
  	function cursor_normalize_diff (diffs, cursor_pos) {
  	  if (cursor_pos === 0) {
  	    return [DIFF_EQUAL, diffs];
  	  }
  	  for (var current_pos = 0, i = 0; i < diffs.length; i++) {
  	    var d = diffs[i];
  	    if (d[0] === DIFF_DELETE || d[0] === DIFF_EQUAL) {
  	      var next_pos = current_pos + d[1].length;
  	      if (cursor_pos === next_pos) {
  	        return [i + 1, diffs];
  	      } else if (cursor_pos < next_pos) {
  	        // copy to prevent side effects
  	        diffs = diffs.slice();
  	        // split d into two diff changes
  	        var split_pos = cursor_pos - current_pos;
  	        var d_left = [d[0], d[1].slice(0, split_pos)];
  	        var d_right = [d[0], d[1].slice(split_pos)];
  	        diffs.splice(i, 1, d_left, d_right);
  	        return [i + 1, diffs];
  	      } else {
  	        current_pos = next_pos;
  	      }
  	    }
  	  }
  	  throw new Error('cursor_pos is out of bounds!')
  	}

  	/*
  	 * Modify a diff such that the edit position is "shifted" to the proposed edit location (cursor_position).
  	 *
  	 * Case 1)
  	 *   Check if a naive shift is possible:
  	 *     [0, X], [ 1, Y] -> [ 1, Y], [0, X]    (if X + Y === Y + X)
  	 *     [0, X], [-1, Y] -> [-1, Y], [0, X]    (if X + Y === Y + X) - holds same result
  	 * Case 2)
  	 *   Check if the following shifts are possible:
  	 *     [0, 'pre'], [ 1, 'prefix'] -> [ 1, 'pre'], [0, 'pre'], [ 1, 'fix']
  	 *     [0, 'pre'], [-1, 'prefix'] -> [-1, 'pre'], [0, 'pre'], [-1, 'fix']
  	 *         ^            ^
  	 *         d          d_next
  	 *
  	 * @param {Array} diffs Array of diff tuples
  	 * @param {Int} cursor_pos Suggested edit position. Must not be out of bounds!
  	 * @return {Array} Array of diff tuples
  	 */
  	function fix_cursor (diffs, cursor_pos) {
  	  var norm = cursor_normalize_diff(diffs, cursor_pos);
  	  var ndiffs = norm[1];
  	  var cursor_pointer = norm[0];
  	  var d = ndiffs[cursor_pointer];
  	  var d_next = ndiffs[cursor_pointer + 1];

  	  if (d == null) {
  	    // Text was deleted from end of original string,
  	    // cursor is now out of bounds in new string
  	    return diffs;
  	  } else if (d[0] !== DIFF_EQUAL) {
  	    // A modification happened at the cursor location.
  	    // This is the expected outcome, so we can return the original diff.
  	    return diffs;
  	  } else {
  	    if (d_next != null && d[1] + d_next[1] === d_next[1] + d[1]) {
  	      // Case 1)
  	      // It is possible to perform a naive shift
  	      ndiffs.splice(cursor_pointer, 2, d_next, d);
  	      return merge_tuples(ndiffs, cursor_pointer, 2)
  	    } else if (d_next != null && d_next[1].indexOf(d[1]) === 0) {
  	      // Case 2)
  	      // d[1] is a prefix of d_next[1]
  	      // We can assume that d_next[0] !== 0, since d[0] === 0
  	      // Shift edit locations..
  	      ndiffs.splice(cursor_pointer, 2, [d_next[0], d[1]], [0, d[1]]);
  	      var suffix = d_next[1].slice(d[1].length);
  	      if (suffix.length > 0) {
  	        ndiffs.splice(cursor_pointer + 2, 0, [d_next[0], suffix]);
  	      }
  	      return merge_tuples(ndiffs, cursor_pointer, 3)
  	    } else {
  	      // Not possible to perform any modification
  	      return diffs;
  	    }
  	  }
  	}

  	/*
  	 * Check diff did not split surrogate pairs.
  	 * Ex. [0, '\uD83D'], [-1, '\uDC36'], [1, '\uDC2F'] -> [-1, '\uD83D\uDC36'], [1, '\uD83D\uDC2F']
  	 *     '\uD83D\uDC36' === '🐶', '\uD83D\uDC2F' === '🐯'
  	 *
  	 * @param {Array} diffs Array of diff tuples
  	 * @return {Array} Array of diff tuples
  	 */
  	function fix_emoji (diffs) {
  	  var compact = false;
  	  var starts_with_pair_end = function(str) {
  	    return str.charCodeAt(0) >= 0xDC00 && str.charCodeAt(0) <= 0xDFFF;
  	  };
  	  var ends_with_pair_start = function(str) {
  	    return str.charCodeAt(str.length-1) >= 0xD800 && str.charCodeAt(str.length-1) <= 0xDBFF;
  	  };
  	  for (var i = 2; i < diffs.length; i += 1) {
  	    if (diffs[i-2][0] === DIFF_EQUAL && ends_with_pair_start(diffs[i-2][1]) &&
  	        diffs[i-1][0] === DIFF_DELETE && starts_with_pair_end(diffs[i-1][1]) &&
  	        diffs[i][0] === DIFF_INSERT && starts_with_pair_end(diffs[i][1])) {
  	      compact = true;

  	      diffs[i-1][1] = diffs[i-2][1].slice(-1) + diffs[i-1][1];
  	      diffs[i][1] = diffs[i-2][1].slice(-1) + diffs[i][1];

  	      diffs[i-2][1] = diffs[i-2][1].slice(0, -1);
  	    }
  	  }
  	  if (!compact) {
  	    return diffs;
  	  }
  	  var fixed_diffs = [];
  	  for (var i = 0; i < diffs.length; i += 1) {
  	    if (diffs[i][1].length > 0) {
  	      fixed_diffs.push(diffs[i]);
  	    }
  	  }
  	  return fixed_diffs;
  	}

  	/*
  	 * Try to merge tuples with their neigbors in a given range.
  	 * E.g. [0, 'a'], [0, 'b'] -> [0, 'ab']
  	 *
  	 * @param {Array} diffs Array of diff tuples.
  	 * @param {Int} start Position of the first element to merge (diffs[start] is also merged with diffs[start - 1]).
  	 * @param {Int} length Number of consecutive elements to check.
  	 * @return {Array} Array of merged diff tuples.
  	 */
  	function merge_tuples (diffs, start, length) {
  	  // Check from (start-1) to (start+length).
  	  for (var i = start + length - 1; i >= 0 && i >= start - 1; i--) {
  	    if (i + 1 < diffs.length) {
  	      var left_d = diffs[i];
  	      var right_d = diffs[i+1];
  	      if (left_d[0] === right_d[1]) {
  	        diffs.splice(i, 2, [left_d[0], left_d[1] + right_d[1]]);
  	      }
  	    }
  	  }
  	  return diffs;
  	}


  	/***/ }),
  	/* 52 */
  	/***/ (function(module, exports) {

  	exports = module.exports = typeof Object.keys === 'function'
  	  ? Object.keys : shim;

  	exports.shim = shim;
  	function shim (obj) {
  	  var keys = [];
  	  for (var key in obj) keys.push(key);
  	  return keys;
  	}


  	/***/ }),
  	/* 53 */
  	/***/ (function(module, exports) {

  	var supportsArgumentsClass = (function(){
  	  return Object.prototype.toString.call(arguments)
  	})() == '[object Arguments]';

  	exports = module.exports = supportsArgumentsClass ? supported : unsupported;

  	exports.supported = supported;
  	function supported(object) {
  	  return Object.prototype.toString.call(object) == '[object Arguments]';
  	}
  	exports.unsupported = unsupported;
  	function unsupported(object){
  	  return object &&
  	    typeof object == 'object' &&
  	    typeof object.length == 'number' &&
  	    Object.prototype.hasOwnProperty.call(object, 'callee') &&
  	    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
  	    false;
  	}

  	/***/ }),
  	/* 54 */
  	/***/ (function(module, exports) {

  	var has = Object.prototype.hasOwnProperty
  	  , prefix = '~';

  	/**
  	 * Constructor to create a storage for our `EE` objects.
  	 * An `Events` instance is a plain object whose properties are event names.
  	 *
  	 * @constructor
  	 * @api private
  	 */
  	function Events() {}

  	//
  	// We try to not inherit from `Object.prototype`. In some engines creating an
  	// instance in this way is faster than calling `Object.create(null)` directly.
  	// If `Object.create(null)` is not supported we prefix the event names with a
  	// character to make sure that the built-in object properties are not
  	// overridden or used as an attack vector.
  	//
  	if (Object.create) {
  	  Events.prototype = Object.create(null);

  	  //
  	  // This hack is needed because the `__proto__` property is still inherited in
  	  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  	  //
  	  if (!new Events().__proto__) prefix = false;
  	}

  	/**
  	 * Representation of a single event listener.
  	 *
  	 * @param {Function} fn The listener function.
  	 * @param {Mixed} context The context to invoke the listener with.
  	 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
  	 * @constructor
  	 * @api private
  	 */
  	function EE(fn, context, once) {
  	  this.fn = fn;
  	  this.context = context;
  	  this.once = once || false;
  	}

  	/**
  	 * Minimal `EventEmitter` interface that is molded against the Node.js
  	 * `EventEmitter` interface.
  	 *
  	 * @constructor
  	 * @api public
  	 */
  	function EventEmitter() {
  	  this._events = new Events();
  	  this._eventsCount = 0;
  	}

  	/**
  	 * Return an array listing the events for which the emitter has registered
  	 * listeners.
  	 *
  	 * @returns {Array}
  	 * @api public
  	 */
  	EventEmitter.prototype.eventNames = function eventNames() {
  	  var names = []
  	    , events
  	    , name;

  	  if (this._eventsCount === 0) return names;

  	  for (name in (events = this._events)) {
  	    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  	  }

  	  if (Object.getOwnPropertySymbols) {
  	    return names.concat(Object.getOwnPropertySymbols(events));
  	  }

  	  return names;
  	};

  	/**
  	 * Return the listeners registered for a given event.
  	 *
  	 * @param {String|Symbol} event The event name.
  	 * @param {Boolean} exists Only check if there are listeners.
  	 * @returns {Array|Boolean}
  	 * @api public
  	 */
  	EventEmitter.prototype.listeners = function listeners(event, exists) {
  	  var evt = prefix ? prefix + event : event
  	    , available = this._events[evt];

  	  if (exists) return !!available;
  	  if (!available) return [];
  	  if (available.fn) return [available.fn];

  	  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
  	    ee[i] = available[i].fn;
  	  }

  	  return ee;
  	};

  	/**
  	 * Calls each of the listeners registered for a given event.
  	 *
  	 * @param {String|Symbol} event The event name.
  	 * @returns {Boolean} `true` if the event had listeners, else `false`.
  	 * @api public
  	 */
  	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  	  var evt = prefix ? prefix + event : event;

  	  if (!this._events[evt]) return false;

  	  var listeners = this._events[evt]
  	    , len = arguments.length
  	    , args
  	    , i;

  	  if (listeners.fn) {
  	    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

  	    switch (len) {
  	      case 1: return listeners.fn.call(listeners.context), true;
  	      case 2: return listeners.fn.call(listeners.context, a1), true;
  	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
  	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
  	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
  	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
  	    }

  	    for (i = 1, args = new Array(len -1); i < len; i++) {
  	      args[i - 1] = arguments[i];
  	    }

  	    listeners.fn.apply(listeners.context, args);
  	  } else {
  	    var length = listeners.length
  	      , j;

  	    for (i = 0; i < length; i++) {
  	      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

  	      switch (len) {
  	        case 1: listeners[i].fn.call(listeners[i].context); break;
  	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
  	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
  	        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
  	        default:
  	          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
  	            args[j - 1] = arguments[j];
  	          }

  	          listeners[i].fn.apply(listeners[i].context, args);
  	      }
  	    }
  	  }

  	  return true;
  	};

  	/**
  	 * Add a listener for a given event.
  	 *
  	 * @param {String|Symbol} event The event name.
  	 * @param {Function} fn The listener function.
  	 * @param {Mixed} [context=this] The context to invoke the listener with.
  	 * @returns {EventEmitter} `this`.
  	 * @api public
  	 */
  	EventEmitter.prototype.on = function on(event, fn, context) {
  	  var listener = new EE(fn, context || this)
  	    , evt = prefix ? prefix + event : event;

  	  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  	  else if (!this._events[evt].fn) this._events[evt].push(listener);
  	  else this._events[evt] = [this._events[evt], listener];

  	  return this;
  	};

  	/**
  	 * Add a one-time listener for a given event.
  	 *
  	 * @param {String|Symbol} event The event name.
  	 * @param {Function} fn The listener function.
  	 * @param {Mixed} [context=this] The context to invoke the listener with.
  	 * @returns {EventEmitter} `this`.
  	 * @api public
  	 */
  	EventEmitter.prototype.once = function once(event, fn, context) {
  	  var listener = new EE(fn, context || this, true)
  	    , evt = prefix ? prefix + event : event;

  	  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  	  else if (!this._events[evt].fn) this._events[evt].push(listener);
  	  else this._events[evt] = [this._events[evt], listener];

  	  return this;
  	};

  	/**
  	 * Remove the listeners of a given event.
  	 *
  	 * @param {String|Symbol} event The event name.
  	 * @param {Function} fn Only remove the listeners that match this function.
  	 * @param {Mixed} context Only remove the listeners that have this context.
  	 * @param {Boolean} once Only remove one-time listeners.
  	 * @returns {EventEmitter} `this`.
  	 * @api public
  	 */
  	EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  	  var evt = prefix ? prefix + event : event;

  	  if (!this._events[evt]) return this;
  	  if (!fn) {
  	    if (--this._eventsCount === 0) this._events = new Events();
  	    else delete this._events[evt];
  	    return this;
  	  }

  	  var listeners = this._events[evt];

  	  if (listeners.fn) {
  	    if (
  	         listeners.fn === fn
  	      && (!once || listeners.once)
  	      && (!context || listeners.context === context)
  	    ) {
  	      if (--this._eventsCount === 0) this._events = new Events();
  	      else delete this._events[evt];
  	    }
  	  } else {
  	    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
  	      if (
  	           listeners[i].fn !== fn
  	        || (once && !listeners[i].once)
  	        || (context && listeners[i].context !== context)
  	      ) {
  	        events.push(listeners[i]);
  	      }
  	    }

  	    //
  	    // Reset the array, or remove it completely if we have no more listeners.
  	    //
  	    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
  	    else if (--this._eventsCount === 0) this._events = new Events();
  	    else delete this._events[evt];
  	  }

  	  return this;
  	};

  	/**
  	 * Remove all listeners, or those of the specified event.
  	 *
  	 * @param {String|Symbol} [event] The event name.
  	 * @returns {EventEmitter} `this`.
  	 * @api public
  	 */
  	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  	  var evt;

  	  if (event) {
  	    evt = prefix ? prefix + event : event;
  	    if (this._events[evt]) {
  	      if (--this._eventsCount === 0) this._events = new Events();
  	      else delete this._events[evt];
  	    }
  	  } else {
  	    this._events = new Events();
  	    this._eventsCount = 0;
  	  }

  	  return this;
  	};

  	//
  	// Alias methods names because people roll like that.
  	//
  	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
  	EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  	//
  	// This function doesn't apply anymore.
  	//
  	EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  	  return this;
  	};

  	//
  	// Expose the prefix.
  	//
  	EventEmitter.prefixed = prefix;

  	//
  	// Allow `EventEmitter` to be imported as module namespace.
  	//
  	EventEmitter.EventEmitter = EventEmitter;

  	//
  	// Expose the module.
  	//
  	if ('undefined' !== typeof module) {
  	  module.exports = EventEmitter;
  	}


  	/***/ }),
  	/* 55 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.matchText = exports.matchSpacing = exports.matchNewline = exports.matchBlot = exports.matchAttributor = exports.default = undefined;

  	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _extend2 = __webpack_require__(3);

  	var _extend3 = _interopRequireDefault(_extend2);

  	var _quillDelta = __webpack_require__(2);

  	var _quillDelta2 = _interopRequireDefault(_quillDelta);

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _quill = __webpack_require__(5);

  	var _quill2 = _interopRequireDefault(_quill);

  	var _logger = __webpack_require__(10);

  	var _logger2 = _interopRequireDefault(_logger);

  	var _module = __webpack_require__(9);

  	var _module2 = _interopRequireDefault(_module);

  	var _align = __webpack_require__(36);

  	var _background = __webpack_require__(37);

  	var _code = __webpack_require__(13);

  	var _code2 = _interopRequireDefault(_code);

  	var _color = __webpack_require__(26);

  	var _direction = __webpack_require__(38);

  	var _font = __webpack_require__(39);

  	var _size = __webpack_require__(40);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var debug = (0, _logger2.default)('quill:clipboard');

  	var DOM_KEY = '__ql-matcher';

  	var CLIPBOARD_CONFIG = [[Node.TEXT_NODE, matchText], [Node.TEXT_NODE, matchNewline], ['br', matchBreak], [Node.ELEMENT_NODE, matchNewline], [Node.ELEMENT_NODE, matchBlot], [Node.ELEMENT_NODE, matchSpacing], [Node.ELEMENT_NODE, matchAttributor], [Node.ELEMENT_NODE, matchStyles], ['li', matchIndent], ['b', matchAlias.bind(matchAlias, 'bold')], ['i', matchAlias.bind(matchAlias, 'italic')], ['style', matchIgnore]];

  	var ATTRIBUTE_ATTRIBUTORS = [_align.AlignAttribute, _direction.DirectionAttribute].reduce(function (memo, attr) {
  	  memo[attr.keyName] = attr;
  	  return memo;
  	}, {});

  	var STYLE_ATTRIBUTORS = [_align.AlignStyle, _background.BackgroundStyle, _color.ColorStyle, _direction.DirectionStyle, _font.FontStyle, _size.SizeStyle].reduce(function (memo, attr) {
  	  memo[attr.keyName] = attr;
  	  return memo;
  	}, {});

  	var Clipboard = function (_Module) {
  	  _inherits(Clipboard, _Module);

  	  function Clipboard(quill, options) {
  	    _classCallCheck(this, Clipboard);

  	    var _this = _possibleConstructorReturn(this, (Clipboard.__proto__ || Object.getPrototypeOf(Clipboard)).call(this, quill, options));

  	    _this.quill.root.addEventListener('paste', _this.onPaste.bind(_this));
  	    _this.container = _this.quill.addContainer('ql-clipboard');
  	    _this.container.setAttribute('contenteditable', true);
  	    _this.container.setAttribute('tabindex', -1);
  	    _this.matchers = [];
  	    CLIPBOARD_CONFIG.concat(_this.options.matchers).forEach(function (_ref) {
  	      var _ref2 = _slicedToArray(_ref, 2),
  	          selector = _ref2[0],
  	          matcher = _ref2[1];

  	      if (!options.matchVisual && matcher === matchSpacing) return;
  	      _this.addMatcher(selector, matcher);
  	    });
  	    return _this;
  	  }

  	  _createClass(Clipboard, [{
  	    key: 'addMatcher',
  	    value: function addMatcher(selector, matcher) {
  	      this.matchers.push([selector, matcher]);
  	    }
  	  }, {
  	    key: 'convert',
  	    value: function convert(html) {
  	      if (typeof html === 'string') {
  	        this.container.innerHTML = html.replace(/\>\r?\n +\</g, '><'); // Remove spaces between tags
  	        return this.convert();
  	      }
  	      var formats = this.quill.getFormat(this.quill.selection.savedRange.index);
  	      if (formats[_code2.default.blotName]) {
  	        var text = this.container.innerText;
  	        this.container.innerHTML = '';
  	        return new _quillDelta2.default().insert(text, _defineProperty({}, _code2.default.blotName, formats[_code2.default.blotName]));
  	      }

  	      var _prepareMatching = this.prepareMatching(),
  	          _prepareMatching2 = _slicedToArray(_prepareMatching, 2),
  	          elementMatchers = _prepareMatching2[0],
  	          textMatchers = _prepareMatching2[1];

  	      var delta = traverse(this.container, elementMatchers, textMatchers);
  	      // Remove trailing newline
  	      if (deltaEndsWith(delta, '\n') && delta.ops[delta.ops.length - 1].attributes == null) {
  	        delta = delta.compose(new _quillDelta2.default().retain(delta.length() - 1).delete(1));
  	      }
  	      debug.log('convert', this.container.innerHTML, delta);
  	      this.container.innerHTML = '';
  	      return delta;
  	    }
  	  }, {
  	    key: 'dangerouslyPasteHTML',
  	    value: function dangerouslyPasteHTML(index, html) {
  	      var source = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _quill2.default.sources.API;

  	      if (typeof index === 'string') {
  	        this.quill.setContents(this.convert(index), html);
  	        this.quill.setSelection(0, _quill2.default.sources.SILENT);
  	      } else {
  	        var paste = this.convert(html);
  	        this.quill.updateContents(new _quillDelta2.default().retain(index).concat(paste), source);
  	        this.quill.setSelection(index + paste.length(), _quill2.default.sources.SILENT);
  	      }
  	    }
  	  }, {
  	    key: 'onPaste',
  	    value: function onPaste(e) {
  	      var _this2 = this;

  	      if (e.defaultPrevented || !this.quill.isEnabled()) return;
  	      var range = this.quill.getSelection();
  	      var delta = new _quillDelta2.default().retain(range.index);
  	      var scrollTop = this.quill.scrollingContainer.scrollTop;
  	      this.container.focus();
  	      this.quill.selection.update(_quill2.default.sources.SILENT);
  	      setTimeout(function () {
  	        delta = delta.concat(_this2.convert()).delete(range.length);
  	        _this2.quill.updateContents(delta, _quill2.default.sources.USER);
  	        // range.length contributes to delta.length()
  	        _this2.quill.setSelection(delta.length() - range.length, _quill2.default.sources.SILENT);
  	        _this2.quill.scrollingContainer.scrollTop = scrollTop;
  	        _this2.quill.focus();
  	      }, 1);
  	    }
  	  }, {
  	    key: 'prepareMatching',
  	    value: function prepareMatching() {
  	      var _this3 = this;

  	      var elementMatchers = [],
  	          textMatchers = [];
  	      this.matchers.forEach(function (pair) {
  	        var _pair = _slicedToArray(pair, 2),
  	            selector = _pair[0],
  	            matcher = _pair[1];

  	        switch (selector) {
  	          case Node.TEXT_NODE:
  	            textMatchers.push(matcher);
  	            break;
  	          case Node.ELEMENT_NODE:
  	            elementMatchers.push(matcher);
  	            break;
  	          default:
  	            [].forEach.call(_this3.container.querySelectorAll(selector), function (node) {
  	              // TODO use weakmap
  	              node[DOM_KEY] = node[DOM_KEY] || [];
  	              node[DOM_KEY].push(matcher);
  	            });
  	            break;
  	        }
  	      });
  	      return [elementMatchers, textMatchers];
  	    }
  	  }]);

  	  return Clipboard;
  	}(_module2.default);

  	Clipboard.DEFAULTS = {
  	  matchers: [],
  	  matchVisual: true
  	};

  	function applyFormat(delta, format, value) {
  	  if ((typeof format === 'undefined' ? 'undefined' : _typeof(format)) === 'object') {
  	    return Object.keys(format).reduce(function (delta, key) {
  	      return applyFormat(delta, key, format[key]);
  	    }, delta);
  	  } else {
  	    return delta.reduce(function (delta, op) {
  	      if (op.attributes && op.attributes[format]) {
  	        return delta.push(op);
  	      } else {
  	        return delta.insert(op.insert, (0, _extend3.default)({}, _defineProperty({}, format, value), op.attributes));
  	      }
  	    }, new _quillDelta2.default());
  	  }
  	}

  	function computeStyle(node) {
  	  if (node.nodeType !== Node.ELEMENT_NODE) return {};
  	  var DOM_KEY = '__ql-computed-style';
  	  return node[DOM_KEY] || (node[DOM_KEY] = window.getComputedStyle(node));
  	}

  	function deltaEndsWith(delta, text) {
  	  var endText = "";
  	  for (var i = delta.ops.length - 1; i >= 0 && endText.length < text.length; --i) {
  	    var op = delta.ops[i];
  	    if (typeof op.insert !== 'string') break;
  	    endText = op.insert + endText;
  	  }
  	  return endText.slice(-1 * text.length) === text;
  	}

  	function isLine(node) {
  	  if (node.childNodes.length === 0) return false; // Exclude embed blocks
  	  var style = computeStyle(node);
  	  return ['block', 'list-item'].indexOf(style.display) > -1;
  	}

  	function traverse(node, elementMatchers, textMatchers) {
  	  // Post-order
  	  if (node.nodeType === node.TEXT_NODE) {
  	    return textMatchers.reduce(function (delta, matcher) {
  	      return matcher(node, delta);
  	    }, new _quillDelta2.default());
  	  } else if (node.nodeType === node.ELEMENT_NODE) {
  	    return [].reduce.call(node.childNodes || [], function (delta, childNode) {
  	      var childrenDelta = traverse(childNode, elementMatchers, textMatchers);
  	      if (childNode.nodeType === node.ELEMENT_NODE) {
  	        childrenDelta = elementMatchers.reduce(function (childrenDelta, matcher) {
  	          return matcher(childNode, childrenDelta);
  	        }, childrenDelta);
  	        childrenDelta = (childNode[DOM_KEY] || []).reduce(function (childrenDelta, matcher) {
  	          return matcher(childNode, childrenDelta);
  	        }, childrenDelta);
  	      }
  	      return delta.concat(childrenDelta);
  	    }, new _quillDelta2.default());
  	  } else {
  	    return new _quillDelta2.default();
  	  }
  	}

  	function matchAlias(format, node, delta) {
  	  return applyFormat(delta, format, true);
  	}

  	function matchAttributor(node, delta) {
  	  var attributes = _parchment2.default.Attributor.Attribute.keys(node);
  	  var classes = _parchment2.default.Attributor.Class.keys(node);
  	  var styles = _parchment2.default.Attributor.Style.keys(node);
  	  var formats = {};
  	  attributes.concat(classes).concat(styles).forEach(function (name) {
  	    var attr = _parchment2.default.query(name, _parchment2.default.Scope.ATTRIBUTE);
  	    if (attr != null) {
  	      formats[attr.attrName] = attr.value(node);
  	      if (formats[attr.attrName]) return;
  	    }
  	    attr = ATTRIBUTE_ATTRIBUTORS[name];
  	    if (attr != null && (attr.attrName === name || attr.keyName === name)) {
  	      formats[attr.attrName] = attr.value(node) || undefined;
  	    }
  	    attr = STYLE_ATTRIBUTORS[name];
  	    if (attr != null && (attr.attrName === name || attr.keyName === name)) {
  	      attr = STYLE_ATTRIBUTORS[name];
  	      formats[attr.attrName] = attr.value(node) || undefined;
  	    }
  	  });
  	  if (Object.keys(formats).length > 0) {
  	    delta = applyFormat(delta, formats);
  	  }
  	  return delta;
  	}

  	function matchBlot(node, delta) {
  	  var match = _parchment2.default.query(node);
  	  if (match == null) return delta;
  	  if (match.prototype instanceof _parchment2.default.Embed) {
  	    var embed = {};
  	    var value = match.value(node);
  	    if (value != null) {
  	      embed[match.blotName] = value;
  	      delta = new _quillDelta2.default().insert(embed, match.formats(node));
  	    }
  	  } else if (typeof match.formats === 'function') {
  	    delta = applyFormat(delta, match.blotName, match.formats(node));
  	  }
  	  return delta;
  	}

  	function matchBreak(node, delta) {
  	  if (!deltaEndsWith(delta, '\n')) {
  	    delta.insert('\n');
  	  }
  	  return delta;
  	}

  	function matchIgnore() {
  	  return new _quillDelta2.default();
  	}

  	function matchIndent(node, delta) {
  	  var match = _parchment2.default.query(node);
  	  if (match == null || match.blotName !== 'list-item' || !deltaEndsWith(delta, '\n')) {
  	    return delta;
  	  }
  	  var indent = -1,
  	      parent = node.parentNode;
  	  while (!parent.classList.contains('ql-clipboard')) {
  	    if ((_parchment2.default.query(parent) || {}).blotName === 'list') {
  	      indent += 1;
  	    }
  	    parent = parent.parentNode;
  	  }
  	  if (indent <= 0) return delta;
  	  return delta.compose(new _quillDelta2.default().retain(delta.length() - 1).retain(1, { indent: indent }));
  	}

  	function matchNewline(node, delta) {
  	  if (!deltaEndsWith(delta, '\n')) {
  	    if (isLine(node) || delta.length() > 0 && node.nextSibling && isLine(node.nextSibling)) {
  	      delta.insert('\n');
  	    }
  	  }
  	  return delta;
  	}

  	function matchSpacing(node, delta) {
  	  if (isLine(node) && node.nextElementSibling != null && !deltaEndsWith(delta, '\n\n')) {
  	    var nodeHeight = node.offsetHeight + parseFloat(computeStyle(node).marginTop) + parseFloat(computeStyle(node).marginBottom);
  	    if (node.nextElementSibling.offsetTop > node.offsetTop + nodeHeight * 1.5) {
  	      delta.insert('\n');
  	    }
  	  }
  	  return delta;
  	}

  	function matchStyles(node, delta) {
  	  var formats = {};
  	  var style = node.style || {};
  	  if (style.fontStyle && computeStyle(node).fontStyle === 'italic') {
  	    formats.italic = true;
  	  }
  	  if (style.fontWeight && (computeStyle(node).fontWeight.startsWith('bold') || parseInt(computeStyle(node).fontWeight) >= 700)) {
  	    formats.bold = true;
  	  }
  	  if (Object.keys(formats).length > 0) {
  	    delta = applyFormat(delta, formats);
  	  }
  	  if (parseFloat(style.textIndent || 0) > 0) {
  	    // Could be 0.5in
  	    delta = new _quillDelta2.default().insert('\t').concat(delta);
  	  }
  	  return delta;
  	}

  	function matchText(node, delta) {
  	  var text = node.data;
  	  // Word represents empty line with <o:p>&nbsp;</o:p>
  	  if (node.parentNode.tagName === 'O:P') {
  	    return delta.insert(text.trim());
  	  }
  	  if (text.trim().length === 0 && node.parentNode.classList.contains('ql-clipboard')) {
  	    return delta;
  	  }
  	  if (!computeStyle(node.parentNode).whiteSpace.startsWith('pre')) {
  	    // eslint-disable-next-line func-style
  	    var replacer = function replacer(collapse, match) {
  	      match = match.replace(/[^\u00a0]/g, ''); // \u00a0 is nbsp;
  	      return match.length < 1 && collapse ? ' ' : match;
  	    };
  	    text = text.replace(/\r\n/g, ' ').replace(/\n/g, ' ');
  	    text = text.replace(/\s\s+/g, replacer.bind(replacer, true)); // collapse whitespace
  	    if (node.previousSibling == null && isLine(node.parentNode) || node.previousSibling != null && isLine(node.previousSibling)) {
  	      text = text.replace(/^\s+/, replacer.bind(replacer, false));
  	    }
  	    if (node.nextSibling == null && isLine(node.parentNode) || node.nextSibling != null && isLine(node.nextSibling)) {
  	      text = text.replace(/\s+$/, replacer.bind(replacer, false));
  	    }
  	  }
  	  return delta.insert(text);
  	}

  	exports.default = Clipboard;
  	exports.matchAttributor = matchAttributor;
  	exports.matchBlot = matchBlot;
  	exports.matchNewline = matchNewline;
  	exports.matchSpacing = matchSpacing;
  	exports.matchText = matchText;

  	/***/ }),
  	/* 56 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _inline = __webpack_require__(6);

  	var _inline2 = _interopRequireDefault(_inline);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var Bold = function (_Inline) {
  	  _inherits(Bold, _Inline);

  	  function Bold() {
  	    _classCallCheck(this, Bold);

  	    return _possibleConstructorReturn(this, (Bold.__proto__ || Object.getPrototypeOf(Bold)).apply(this, arguments));
  	  }

  	  _createClass(Bold, [{
  	    key: 'optimize',
  	    value: function optimize(context) {
  	      _get(Bold.prototype.__proto__ || Object.getPrototypeOf(Bold.prototype), 'optimize', this).call(this, context);
  	      if (this.domNode.tagName !== this.statics.tagName[0]) {
  	        this.replaceWith(this.statics.blotName);
  	      }
  	    }
  	  }], [{
  	    key: 'create',
  	    value: function create() {
  	      return _get(Bold.__proto__ || Object.getPrototypeOf(Bold), 'create', this).call(this);
  	    }
  	  }, {
  	    key: 'formats',
  	    value: function formats() {
  	      return true;
  	    }
  	  }]);

  	  return Bold;
  	}(_inline2.default);

  	Bold.blotName = 'bold';
  	Bold.tagName = ['STRONG', 'B'];

  	exports.default = Bold;

  	/***/ }),
  	/* 57 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.addControls = exports.default = undefined;

  	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _quillDelta = __webpack_require__(2);

  	var _quillDelta2 = _interopRequireDefault(_quillDelta);

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _quill = __webpack_require__(5);

  	var _quill2 = _interopRequireDefault(_quill);

  	var _logger = __webpack_require__(10);

  	var _logger2 = _interopRequireDefault(_logger);

  	var _module = __webpack_require__(9);

  	var _module2 = _interopRequireDefault(_module);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var debug = (0, _logger2.default)('quill:toolbar');

  	var Toolbar = function (_Module) {
  	  _inherits(Toolbar, _Module);

  	  function Toolbar(quill, options) {
  	    _classCallCheck(this, Toolbar);

  	    var _this = _possibleConstructorReturn(this, (Toolbar.__proto__ || Object.getPrototypeOf(Toolbar)).call(this, quill, options));

  	    if (Array.isArray(_this.options.container)) {
  	      var container = document.createElement('div');
  	      addControls(container, _this.options.container);
  	      quill.container.parentNode.insertBefore(container, quill.container);
  	      _this.container = container;
  	    } else if (typeof _this.options.container === 'string') {
  	      _this.container = document.querySelector(_this.options.container);
  	    } else {
  	      _this.container = _this.options.container;
  	    }
  	    if (!(_this.container instanceof HTMLElement)) {
  	      var _ret;

  	      return _ret = debug.error('Container required for toolbar', _this.options), _possibleConstructorReturn(_this, _ret);
  	    }
  	    _this.container.classList.add('ql-toolbar');
  	    _this.controls = [];
  	    _this.handlers = {};
  	    Object.keys(_this.options.handlers).forEach(function (format) {
  	      _this.addHandler(format, _this.options.handlers[format]);
  	    });
  	    [].forEach.call(_this.container.querySelectorAll('button, select'), function (input) {
  	      _this.attach(input);
  	    });
  	    _this.quill.on(_quill2.default.events.EDITOR_CHANGE, function (type, range) {
  	      if (type === _quill2.default.events.SELECTION_CHANGE) {
  	        _this.update(range);
  	      }
  	    });
  	    _this.quill.on(_quill2.default.events.SCROLL_OPTIMIZE, function () {
  	      var _this$quill$selection = _this.quill.selection.getRange(),
  	          _this$quill$selection2 = _slicedToArray(_this$quill$selection, 1),
  	          range = _this$quill$selection2[0]; // quill.getSelection triggers update


  	      _this.update(range);
  	    });
  	    return _this;
  	  }

  	  _createClass(Toolbar, [{
  	    key: 'addHandler',
  	    value: function addHandler(format, handler) {
  	      this.handlers[format] = handler;
  	    }
  	  }, {
  	    key: 'attach',
  	    value: function attach(input) {
  	      var _this2 = this;

  	      var format = [].find.call(input.classList, function (className) {
  	        return className.indexOf('ql-') === 0;
  	      });
  	      if (!format) return;
  	      format = format.slice('ql-'.length);
  	      if (input.tagName === 'BUTTON') {
  	        input.setAttribute('type', 'button');
  	      }
  	      if (this.handlers[format] == null) {
  	        if (this.quill.scroll.whitelist != null && this.quill.scroll.whitelist[format] == null) {
  	          debug.warn('ignoring attaching to disabled format', format, input);
  	          return;
  	        }
  	        if (_parchment2.default.query(format) == null) {
  	          debug.warn('ignoring attaching to nonexistent format', format, input);
  	          return;
  	        }
  	      }
  	      var eventName = input.tagName === 'SELECT' ? 'change' : 'click';
  	      input.addEventListener(eventName, function (e) {
  	        var value = void 0;
  	        if (input.tagName === 'SELECT') {
  	          if (input.selectedIndex < 0) return;
  	          var selected = input.options[input.selectedIndex];
  	          if (selected.hasAttribute('selected')) {
  	            value = false;
  	          } else {
  	            value = selected.value || false;
  	          }
  	        } else {
  	          if (input.classList.contains('ql-active')) {
  	            value = false;
  	          } else {
  	            value = input.value || !input.hasAttribute('value');
  	          }
  	          e.preventDefault();
  	        }
  	        _this2.quill.focus();

  	        var _quill$selection$getR = _this2.quill.selection.getRange(),
  	            _quill$selection$getR2 = _slicedToArray(_quill$selection$getR, 1),
  	            range = _quill$selection$getR2[0];

  	        if (_this2.handlers[format] != null) {
  	          _this2.handlers[format].call(_this2, value);
  	        } else if (_parchment2.default.query(format).prototype instanceof _parchment2.default.Embed) {
  	          value = prompt('Enter ' + format);
  	          if (!value) return;
  	          _this2.quill.updateContents(new _quillDelta2.default().retain(range.index).delete(range.length).insert(_defineProperty({}, format, value)), _quill2.default.sources.USER);
  	        } else {
  	          _this2.quill.format(format, value, _quill2.default.sources.USER);
  	        }
  	        _this2.update(range);
  	      });
  	      // TODO use weakmap
  	      this.controls.push([format, input]);
  	    }
  	  }, {
  	    key: 'update',
  	    value: function update(range) {
  	      var formats = range == null ? {} : this.quill.getFormat(range);
  	      this.controls.forEach(function (pair) {
  	        var _pair = _slicedToArray(pair, 2),
  	            format = _pair[0],
  	            input = _pair[1];

  	        if (input.tagName === 'SELECT') {
  	          var option = void 0;
  	          if (range == null) {
  	            option = null;
  	          } else if (formats[format] == null) {
  	            option = input.querySelector('option[selected]');
  	          } else if (!Array.isArray(formats[format])) {
  	            var value = formats[format];
  	            if (typeof value === 'string') {
  	              value = value.replace(/\"/g, '\\"');
  	            }
  	            option = input.querySelector('option[value="' + value + '"]');
  	          }
  	          if (option == null) {
  	            input.value = ''; // TODO make configurable?
  	            input.selectedIndex = -1;
  	          } else {
  	            option.selected = true;
  	          }
  	        } else {
  	          if (range == null) {
  	            input.classList.remove('ql-active');
  	          } else if (input.hasAttribute('value')) {
  	            // both being null should match (default values)
  	            // '1' should match with 1 (headers)
  	            var isActive = formats[format] === input.getAttribute('value') || formats[format] != null && formats[format].toString() === input.getAttribute('value') || formats[format] == null && !input.getAttribute('value');
  	            input.classList.toggle('ql-active', isActive);
  	          } else {
  	            input.classList.toggle('ql-active', formats[format] != null);
  	          }
  	        }
  	      });
  	    }
  	  }]);

  	  return Toolbar;
  	}(_module2.default);

  	Toolbar.DEFAULTS = {};

  	function addButton(container, format, value) {
  	  var input = document.createElement('button');
  	  input.setAttribute('type', 'button');
  	  input.classList.add('ql-' + format);
  	  if (value != null) {
  	    input.value = value;
  	  }
  	  container.appendChild(input);
  	}

  	function addControls(container, groups) {
  	  if (!Array.isArray(groups[0])) {
  	    groups = [groups];
  	  }
  	  groups.forEach(function (controls) {
  	    var group = document.createElement('span');
  	    group.classList.add('ql-formats');
  	    controls.forEach(function (control) {
  	      if (typeof control === 'string') {
  	        addButton(group, control);
  	      } else {
  	        var format = Object.keys(control)[0];
  	        var value = control[format];
  	        if (Array.isArray(value)) {
  	          addSelect(group, format, value);
  	        } else {
  	          addButton(group, format, value);
  	        }
  	      }
  	    });
  	    container.appendChild(group);
  	  });
  	}

  	function addSelect(container, format, values) {
  	  var input = document.createElement('select');
  	  input.classList.add('ql-' + format);
  	  values.forEach(function (value) {
  	    var option = document.createElement('option');
  	    if (value !== false) {
  	      option.setAttribute('value', value);
  	    } else {
  	      option.setAttribute('selected', 'selected');
  	    }
  	    input.appendChild(option);
  	  });
  	  container.appendChild(input);
  	}

  	Toolbar.DEFAULTS = {
  	  container: null,
  	  handlers: {
  	    clean: function clean() {
  	      var _this3 = this;

  	      var range = this.quill.getSelection();
  	      if (range == null) return;
  	      if (range.length == 0) {
  	        var formats = this.quill.getFormat();
  	        Object.keys(formats).forEach(function (name) {
  	          // Clean functionality in existing apps only clean inline formats
  	          if (_parchment2.default.query(name, _parchment2.default.Scope.INLINE) != null) {
  	            _this3.quill.format(name, false);
  	          }
  	        });
  	      } else {
  	        this.quill.removeFormat(range, _quill2.default.sources.USER);
  	      }
  	    },
  	    direction: function direction(value) {
  	      var align = this.quill.getFormat()['align'];
  	      if (value === 'rtl' && align == null) {
  	        this.quill.format('align', 'right', _quill2.default.sources.USER);
  	      } else if (!value && align === 'right') {
  	        this.quill.format('align', false, _quill2.default.sources.USER);
  	      }
  	      this.quill.format('direction', value, _quill2.default.sources.USER);
  	    },
  	    indent: function indent(value) {
  	      var range = this.quill.getSelection();
  	      var formats = this.quill.getFormat(range);
  	      var indent = parseInt(formats.indent || 0);
  	      if (value === '+1' || value === '-1') {
  	        var modifier = value === '+1' ? 1 : -1;
  	        if (formats.direction === 'rtl') modifier *= -1;
  	        this.quill.format('indent', indent + modifier, _quill2.default.sources.USER);
  	      }
  	    },
  	    link: function link(value) {
  	      if (value === true) {
  	        value = prompt('Enter link URL:');
  	      }
  	      this.quill.format('link', value, _quill2.default.sources.USER);
  	    },
  	    list: function list(value) {
  	      var range = this.quill.getSelection();
  	      var formats = this.quill.getFormat(range);
  	      if (value === 'check') {
  	        if (formats['list'] === 'checked' || formats['list'] === 'unchecked') {
  	          this.quill.format('list', false, _quill2.default.sources.USER);
  	        } else {
  	          this.quill.format('list', 'unchecked', _quill2.default.sources.USER);
  	        }
  	      } else {
  	        this.quill.format('list', value, _quill2.default.sources.USER);
  	      }
  	    }
  	  }
  	};

  	exports.default = Toolbar;
  	exports.addControls = addControls;

  	/***/ }),
  	/* 58 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <polyline class=\"ql-even ql-stroke\" points=\"5 7 3 9 5 11\"></polyline> <polyline class=\"ql-even ql-stroke\" points=\"13 7 15 9 13 11\"></polyline> <line class=ql-stroke x1=10 x2=8 y1=5 y2=13></line> </svg>";

  	/***/ }),
  	/* 59 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _picker = __webpack_require__(28);

  	var _picker2 = _interopRequireDefault(_picker);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var ColorPicker = function (_Picker) {
  	  _inherits(ColorPicker, _Picker);

  	  function ColorPicker(select, label) {
  	    _classCallCheck(this, ColorPicker);

  	    var _this = _possibleConstructorReturn(this, (ColorPicker.__proto__ || Object.getPrototypeOf(ColorPicker)).call(this, select));

  	    _this.label.innerHTML = label;
  	    _this.container.classList.add('ql-color-picker');
  	    [].slice.call(_this.container.querySelectorAll('.ql-picker-item'), 0, 7).forEach(function (item) {
  	      item.classList.add('ql-primary');
  	    });
  	    return _this;
  	  }

  	  _createClass(ColorPicker, [{
  	    key: 'buildItem',
  	    value: function buildItem(option) {
  	      var item = _get(ColorPicker.prototype.__proto__ || Object.getPrototypeOf(ColorPicker.prototype), 'buildItem', this).call(this, option);
  	      item.style.backgroundColor = option.getAttribute('value') || '';
  	      return item;
  	    }
  	  }, {
  	    key: 'selectItem',
  	    value: function selectItem(item, trigger) {
  	      _get(ColorPicker.prototype.__proto__ || Object.getPrototypeOf(ColorPicker.prototype), 'selectItem', this).call(this, item, trigger);
  	      var colorLabel = this.label.querySelector('.ql-color-label');
  	      var value = item ? item.getAttribute('data-value') || '' : '';
  	      if (colorLabel) {
  	        if (colorLabel.tagName === 'line') {
  	          colorLabel.style.stroke = value;
  	        } else {
  	          colorLabel.style.fill = value;
  	        }
  	      }
  	    }
  	  }]);

  	  return ColorPicker;
  	}(_picker2.default);

  	exports.default = ColorPicker;

  	/***/ }),
  	/* 60 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _picker = __webpack_require__(28);

  	var _picker2 = _interopRequireDefault(_picker);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var IconPicker = function (_Picker) {
  	  _inherits(IconPicker, _Picker);

  	  function IconPicker(select, icons) {
  	    _classCallCheck(this, IconPicker);

  	    var _this = _possibleConstructorReturn(this, (IconPicker.__proto__ || Object.getPrototypeOf(IconPicker)).call(this, select));

  	    _this.container.classList.add('ql-icon-picker');
  	    [].forEach.call(_this.container.querySelectorAll('.ql-picker-item'), function (item) {
  	      item.innerHTML = icons[item.getAttribute('data-value') || ''];
  	    });
  	    _this.defaultItem = _this.container.querySelector('.ql-selected');
  	    _this.selectItem(_this.defaultItem);
  	    return _this;
  	  }

  	  _createClass(IconPicker, [{
  	    key: 'selectItem',
  	    value: function selectItem(item, trigger) {
  	      _get(IconPicker.prototype.__proto__ || Object.getPrototypeOf(IconPicker.prototype), 'selectItem', this).call(this, item, trigger);
  	      item = item || this.defaultItem;
  	      this.label.innerHTML = item.innerHTML;
  	    }
  	  }]);

  	  return IconPicker;
  	}(_picker2.default);

  	exports.default = IconPicker;

  	/***/ }),
  	/* 61 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	var Tooltip = function () {
  	  function Tooltip(quill, boundsContainer) {
  	    var _this = this;

  	    _classCallCheck(this, Tooltip);

  	    this.quill = quill;
  	    this.boundsContainer = boundsContainer || document.body;
  	    this.root = quill.addContainer('ql-tooltip');
  	    this.root.innerHTML = this.constructor.TEMPLATE;
  	    if (this.quill.root === this.quill.scrollingContainer) {
  	      this.quill.root.addEventListener('scroll', function () {
  	        _this.root.style.marginTop = -1 * _this.quill.root.scrollTop + 'px';
  	      });
  	    }
  	    this.hide();
  	  }

  	  _createClass(Tooltip, [{
  	    key: 'hide',
  	    value: function hide() {
  	      this.root.classList.add('ql-hidden');
  	    }
  	  }, {
  	    key: 'position',
  	    value: function position(reference) {
  	      var left = reference.left + reference.width / 2 - this.root.offsetWidth / 2;
  	      // root.scrollTop should be 0 if scrollContainer !== root
  	      var top = reference.bottom + this.quill.root.scrollTop;
  	      this.root.style.left = left + 'px';
  	      this.root.style.top = top + 'px';
  	      this.root.classList.remove('ql-flip');
  	      var containerBounds = this.boundsContainer.getBoundingClientRect();
  	      var rootBounds = this.root.getBoundingClientRect();
  	      var shift = 0;
  	      if (rootBounds.right > containerBounds.right) {
  	        shift = containerBounds.right - rootBounds.right;
  	        this.root.style.left = left + shift + 'px';
  	      }
  	      if (rootBounds.left < containerBounds.left) {
  	        shift = containerBounds.left - rootBounds.left;
  	        this.root.style.left = left + shift + 'px';
  	      }
  	      if (rootBounds.bottom > containerBounds.bottom) {
  	        var height = rootBounds.bottom - rootBounds.top;
  	        var verticalShift = reference.bottom - reference.top + height;
  	        this.root.style.top = top - verticalShift + 'px';
  	        this.root.classList.add('ql-flip');
  	      }
  	      return shift;
  	    }
  	  }, {
  	    key: 'show',
  	    value: function show() {
  	      this.root.classList.remove('ql-editing');
  	      this.root.classList.remove('ql-hidden');
  	    }
  	  }]);

  	  return Tooltip;
  	}();

  	exports.default = Tooltip;

  	/***/ }),
  	/* 62 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _extend = __webpack_require__(3);

  	var _extend2 = _interopRequireDefault(_extend);

  	var _emitter = __webpack_require__(8);

  	var _emitter2 = _interopRequireDefault(_emitter);

  	var _base = __webpack_require__(43);

  	var _base2 = _interopRequireDefault(_base);

  	var _link = __webpack_require__(27);

  	var _link2 = _interopRequireDefault(_link);

  	var _selection = __webpack_require__(15);

  	var _icons = __webpack_require__(41);

  	var _icons2 = _interopRequireDefault(_icons);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var TOOLBAR_CONFIG = [[{ header: ['1', '2', '3', false] }], ['bold', 'italic', 'underline', 'link'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']];

  	var SnowTheme = function (_BaseTheme) {
  	  _inherits(SnowTheme, _BaseTheme);

  	  function SnowTheme(quill, options) {
  	    _classCallCheck(this, SnowTheme);

  	    if (options.modules.toolbar != null && options.modules.toolbar.container == null) {
  	      options.modules.toolbar.container = TOOLBAR_CONFIG;
  	    }

  	    var _this = _possibleConstructorReturn(this, (SnowTheme.__proto__ || Object.getPrototypeOf(SnowTheme)).call(this, quill, options));

  	    _this.quill.container.classList.add('ql-snow');
  	    return _this;
  	  }

  	  _createClass(SnowTheme, [{
  	    key: 'extendToolbar',
  	    value: function extendToolbar(toolbar) {
  	      toolbar.container.classList.add('ql-snow');
  	      this.buildButtons([].slice.call(toolbar.container.querySelectorAll('button')), _icons2.default);
  	      this.buildPickers([].slice.call(toolbar.container.querySelectorAll('select')), _icons2.default);
  	      this.tooltip = new SnowTooltip(this.quill, this.options.bounds);
  	      if (toolbar.container.querySelector('.ql-link')) {
  	        this.quill.keyboard.addBinding({ key: 'K', shortKey: true }, function (range, context) {
  	          toolbar.handlers['link'].call(toolbar, !context.format.link);
  	        });
  	      }
  	    }
  	  }]);

  	  return SnowTheme;
  	}(_base2.default);

  	SnowTheme.DEFAULTS = (0, _extend2.default)(true, {}, _base2.default.DEFAULTS, {
  	  modules: {
  	    toolbar: {
  	      handlers: {
  	        link: function link(value) {
  	          if (value) {
  	            var range = this.quill.getSelection();
  	            if (range == null || range.length == 0) return;
  	            var preview = this.quill.getText(range);
  	            if (/^\S+@\S+\.\S+$/.test(preview) && preview.indexOf('mailto:') !== 0) {
  	              preview = 'mailto:' + preview;
  	            }
  	            var tooltip = this.quill.theme.tooltip;
  	            tooltip.edit('link', preview);
  	          } else {
  	            this.quill.format('link', false);
  	          }
  	        }
  	      }
  	    }
  	  }
  	});

  	var SnowTooltip = function (_BaseTooltip) {
  	  _inherits(SnowTooltip, _BaseTooltip);

  	  function SnowTooltip(quill, bounds) {
  	    _classCallCheck(this, SnowTooltip);

  	    var _this2 = _possibleConstructorReturn(this, (SnowTooltip.__proto__ || Object.getPrototypeOf(SnowTooltip)).call(this, quill, bounds));

  	    _this2.preview = _this2.root.querySelector('a.ql-preview');
  	    return _this2;
  	  }

  	  _createClass(SnowTooltip, [{
  	    key: 'listen',
  	    value: function listen() {
  	      var _this3 = this;

  	      _get(SnowTooltip.prototype.__proto__ || Object.getPrototypeOf(SnowTooltip.prototype), 'listen', this).call(this);
  	      this.root.querySelector('a.ql-action').addEventListener('click', function (event) {
  	        if (_this3.root.classList.contains('ql-editing')) {
  	          _this3.save();
  	        } else {
  	          _this3.edit('link', _this3.preview.textContent);
  	        }
  	        event.preventDefault();
  	      });
  	      this.root.querySelector('a.ql-remove').addEventListener('click', function (event) {
  	        if (_this3.linkRange != null) {
  	          var range = _this3.linkRange;
  	          _this3.restoreFocus();
  	          _this3.quill.formatText(range, 'link', false, _emitter2.default.sources.USER);
  	          delete _this3.linkRange;
  	        }
  	        event.preventDefault();
  	        _this3.hide();
  	      });
  	      this.quill.on(_emitter2.default.events.SELECTION_CHANGE, function (range, oldRange, source) {
  	        if (range == null) return;
  	        if (range.length === 0 && source === _emitter2.default.sources.USER) {
  	          var _quill$scroll$descend = _this3.quill.scroll.descendant(_link2.default, range.index),
  	              _quill$scroll$descend2 = _slicedToArray(_quill$scroll$descend, 2),
  	              link = _quill$scroll$descend2[0],
  	              offset = _quill$scroll$descend2[1];

  	          if (link != null) {
  	            _this3.linkRange = new _selection.Range(range.index - offset, link.length());
  	            var preview = _link2.default.formats(link.domNode);
  	            _this3.preview.textContent = preview;
  	            _this3.preview.setAttribute('href', preview);
  	            _this3.show();
  	            _this3.position(_this3.quill.getBounds(_this3.linkRange));
  	            return;
  	          }
  	        } else {
  	          delete _this3.linkRange;
  	        }
  	        _this3.hide();
  	      });
  	    }
  	  }, {
  	    key: 'show',
  	    value: function show() {
  	      _get(SnowTooltip.prototype.__proto__ || Object.getPrototypeOf(SnowTooltip.prototype), 'show', this).call(this);
  	      this.root.removeAttribute('data-mode');
  	    }
  	  }]);

  	  return SnowTooltip;
  	}(_base.BaseTooltip);

  	SnowTooltip.TEMPLATE = ['<a class="ql-preview" rel="noopener noreferrer" target="_blank" href="about:blank"></a>', '<input type="text" data-formula="e=mc^2" data-link="https://quilljs.com" data-video="Embed URL">', '<a class="ql-action"></a>', '<a class="ql-remove"></a>'].join('');

  	exports.default = SnowTheme;

  	/***/ }),
  	/* 63 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _core = __webpack_require__(29);

  	var _core2 = _interopRequireDefault(_core);

  	var _align = __webpack_require__(36);

  	var _direction = __webpack_require__(38);

  	var _indent = __webpack_require__(64);

  	var _blockquote = __webpack_require__(65);

  	var _blockquote2 = _interopRequireDefault(_blockquote);

  	var _header = __webpack_require__(66);

  	var _header2 = _interopRequireDefault(_header);

  	var _list = __webpack_require__(67);

  	var _list2 = _interopRequireDefault(_list);

  	var _background = __webpack_require__(37);

  	var _color = __webpack_require__(26);

  	var _font = __webpack_require__(39);

  	var _size = __webpack_require__(40);

  	var _bold = __webpack_require__(56);

  	var _bold2 = _interopRequireDefault(_bold);

  	var _italic = __webpack_require__(68);

  	var _italic2 = _interopRequireDefault(_italic);

  	var _link = __webpack_require__(27);

  	var _link2 = _interopRequireDefault(_link);

  	var _script = __webpack_require__(69);

  	var _script2 = _interopRequireDefault(_script);

  	var _strike = __webpack_require__(70);

  	var _strike2 = _interopRequireDefault(_strike);

  	var _underline = __webpack_require__(71);

  	var _underline2 = _interopRequireDefault(_underline);

  	var _image = __webpack_require__(72);

  	var _image2 = _interopRequireDefault(_image);

  	var _video = __webpack_require__(73);

  	var _video2 = _interopRequireDefault(_video);

  	var _code = __webpack_require__(13);

  	var _code2 = _interopRequireDefault(_code);

  	var _formula = __webpack_require__(74);

  	var _formula2 = _interopRequireDefault(_formula);

  	var _syntax = __webpack_require__(75);

  	var _syntax2 = _interopRequireDefault(_syntax);

  	var _toolbar = __webpack_require__(57);

  	var _toolbar2 = _interopRequireDefault(_toolbar);

  	var _icons = __webpack_require__(41);

  	var _icons2 = _interopRequireDefault(_icons);

  	var _picker = __webpack_require__(28);

  	var _picker2 = _interopRequireDefault(_picker);

  	var _colorPicker = __webpack_require__(59);

  	var _colorPicker2 = _interopRequireDefault(_colorPicker);

  	var _iconPicker = __webpack_require__(60);

  	var _iconPicker2 = _interopRequireDefault(_iconPicker);

  	var _tooltip = __webpack_require__(61);

  	var _tooltip2 = _interopRequireDefault(_tooltip);

  	var _bubble = __webpack_require__(108);

  	var _bubble2 = _interopRequireDefault(_bubble);

  	var _snow = __webpack_require__(62);

  	var _snow2 = _interopRequireDefault(_snow);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	_core2.default.register({
  	  'attributors/attribute/direction': _direction.DirectionAttribute,

  	  'attributors/class/align': _align.AlignClass,
  	  'attributors/class/background': _background.BackgroundClass,
  	  'attributors/class/color': _color.ColorClass,
  	  'attributors/class/direction': _direction.DirectionClass,
  	  'attributors/class/font': _font.FontClass,
  	  'attributors/class/size': _size.SizeClass,

  	  'attributors/style/align': _align.AlignStyle,
  	  'attributors/style/background': _background.BackgroundStyle,
  	  'attributors/style/color': _color.ColorStyle,
  	  'attributors/style/direction': _direction.DirectionStyle,
  	  'attributors/style/font': _font.FontStyle,
  	  'attributors/style/size': _size.SizeStyle
  	}, true);

  	_core2.default.register({
  	  'formats/align': _align.AlignClass,
  	  'formats/direction': _direction.DirectionClass,
  	  'formats/indent': _indent.IndentClass,

  	  'formats/background': _background.BackgroundStyle,
  	  'formats/color': _color.ColorStyle,
  	  'formats/font': _font.FontClass,
  	  'formats/size': _size.SizeClass,

  	  'formats/blockquote': _blockquote2.default,
  	  'formats/code-block': _code2.default,
  	  'formats/header': _header2.default,
  	  'formats/list': _list2.default,

  	  'formats/bold': _bold2.default,
  	  'formats/code': _code.Code,
  	  'formats/italic': _italic2.default,
  	  'formats/link': _link2.default,
  	  'formats/script': _script2.default,
  	  'formats/strike': _strike2.default,
  	  'formats/underline': _underline2.default,

  	  'formats/image': _image2.default,
  	  'formats/video': _video2.default,

  	  'formats/list/item': _list.ListItem,

  	  'modules/formula': _formula2.default,
  	  'modules/syntax': _syntax2.default,
  	  'modules/toolbar': _toolbar2.default,

  	  'themes/bubble': _bubble2.default,
  	  'themes/snow': _snow2.default,

  	  'ui/icons': _icons2.default,
  	  'ui/picker': _picker2.default,
  	  'ui/icon-picker': _iconPicker2.default,
  	  'ui/color-picker': _colorPicker2.default,
  	  'ui/tooltip': _tooltip2.default
  	}, true);

  	exports.default = _core2.default;

  	/***/ }),
  	/* 64 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.IndentClass = undefined;

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var IdentAttributor = function (_Parchment$Attributor) {
  	  _inherits(IdentAttributor, _Parchment$Attributor);

  	  function IdentAttributor() {
  	    _classCallCheck(this, IdentAttributor);

  	    return _possibleConstructorReturn(this, (IdentAttributor.__proto__ || Object.getPrototypeOf(IdentAttributor)).apply(this, arguments));
  	  }

  	  _createClass(IdentAttributor, [{
  	    key: 'add',
  	    value: function add(node, value) {
  	      if (value === '+1' || value === '-1') {
  	        var indent = this.value(node) || 0;
  	        value = value === '+1' ? indent + 1 : indent - 1;
  	      }
  	      if (value === 0) {
  	        this.remove(node);
  	        return true;
  	      } else {
  	        return _get(IdentAttributor.prototype.__proto__ || Object.getPrototypeOf(IdentAttributor.prototype), 'add', this).call(this, node, value);
  	      }
  	    }
  	  }, {
  	    key: 'canAdd',
  	    value: function canAdd(node, value) {
  	      return _get(IdentAttributor.prototype.__proto__ || Object.getPrototypeOf(IdentAttributor.prototype), 'canAdd', this).call(this, node, value) || _get(IdentAttributor.prototype.__proto__ || Object.getPrototypeOf(IdentAttributor.prototype), 'canAdd', this).call(this, node, parseInt(value));
  	    }
  	  }, {
  	    key: 'value',
  	    value: function value(node) {
  	      return parseInt(_get(IdentAttributor.prototype.__proto__ || Object.getPrototypeOf(IdentAttributor.prototype), 'value', this).call(this, node)) || undefined; // Don't return NaN
  	    }
  	  }]);

  	  return IdentAttributor;
  	}(_parchment2.default.Attributor.Class);

  	var IndentClass = new IdentAttributor('indent', 'ql-indent', {
  	  scope: _parchment2.default.Scope.BLOCK,
  	  whitelist: [1, 2, 3, 4, 5, 6, 7, 8]
  	});

  	exports.IndentClass = IndentClass;

  	/***/ }),
  	/* 65 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _block = __webpack_require__(4);

  	var _block2 = _interopRequireDefault(_block);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var Blockquote = function (_Block) {
  	  _inherits(Blockquote, _Block);

  	  function Blockquote() {
  	    _classCallCheck(this, Blockquote);

  	    return _possibleConstructorReturn(this, (Blockquote.__proto__ || Object.getPrototypeOf(Blockquote)).apply(this, arguments));
  	  }

  	  return Blockquote;
  	}(_block2.default);

  	Blockquote.blotName = 'blockquote';
  	Blockquote.tagName = 'blockquote';

  	exports.default = Blockquote;

  	/***/ }),
  	/* 66 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _block = __webpack_require__(4);

  	var _block2 = _interopRequireDefault(_block);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var Header = function (_Block) {
  	  _inherits(Header, _Block);

  	  function Header() {
  	    _classCallCheck(this, Header);

  	    return _possibleConstructorReturn(this, (Header.__proto__ || Object.getPrototypeOf(Header)).apply(this, arguments));
  	  }

  	  _createClass(Header, null, [{
  	    key: 'formats',
  	    value: function formats(domNode) {
  	      return this.tagName.indexOf(domNode.tagName) + 1;
  	    }
  	  }]);

  	  return Header;
  	}(_block2.default);

  	Header.blotName = 'header';
  	Header.tagName = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

  	exports.default = Header;

  	/***/ }),
  	/* 67 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.default = exports.ListItem = undefined;

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _block = __webpack_require__(4);

  	var _block2 = _interopRequireDefault(_block);

  	var _container = __webpack_require__(25);

  	var _container2 = _interopRequireDefault(_container);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var ListItem = function (_Block) {
  	  _inherits(ListItem, _Block);

  	  function ListItem() {
  	    _classCallCheck(this, ListItem);

  	    return _possibleConstructorReturn(this, (ListItem.__proto__ || Object.getPrototypeOf(ListItem)).apply(this, arguments));
  	  }

  	  _createClass(ListItem, [{
  	    key: 'format',
  	    value: function format(name, value) {
  	      if (name === List.blotName && !value) {
  	        this.replaceWith(_parchment2.default.create(this.statics.scope));
  	      } else {
  	        _get(ListItem.prototype.__proto__ || Object.getPrototypeOf(ListItem.prototype), 'format', this).call(this, name, value);
  	      }
  	    }
  	  }, {
  	    key: 'remove',
  	    value: function remove() {
  	      if (this.prev == null && this.next == null) {
  	        this.parent.remove();
  	      } else {
  	        _get(ListItem.prototype.__proto__ || Object.getPrototypeOf(ListItem.prototype), 'remove', this).call(this);
  	      }
  	    }
  	  }, {
  	    key: 'replaceWith',
  	    value: function replaceWith(name, value) {
  	      this.parent.isolate(this.offset(this.parent), this.length());
  	      if (name === this.parent.statics.blotName) {
  	        this.parent.replaceWith(name, value);
  	        return this;
  	      } else {
  	        this.parent.unwrap();
  	        return _get(ListItem.prototype.__proto__ || Object.getPrototypeOf(ListItem.prototype), 'replaceWith', this).call(this, name, value);
  	      }
  	    }
  	  }], [{
  	    key: 'formats',
  	    value: function formats(domNode) {
  	      return domNode.tagName === this.tagName ? undefined : _get(ListItem.__proto__ || Object.getPrototypeOf(ListItem), 'formats', this).call(this, domNode);
  	    }
  	  }]);

  	  return ListItem;
  	}(_block2.default);

  	ListItem.blotName = 'list-item';
  	ListItem.tagName = 'LI';

  	var List = function (_Container) {
  	  _inherits(List, _Container);

  	  _createClass(List, null, [{
  	    key: 'create',
  	    value: function create(value) {
  	      var tagName = value === 'ordered' ? 'OL' : 'UL';
  	      var node = _get(List.__proto__ || Object.getPrototypeOf(List), 'create', this).call(this, tagName);
  	      if (value === 'checked' || value === 'unchecked') {
  	        node.setAttribute('data-checked', value === 'checked');
  	      }
  	      return node;
  	    }
  	  }, {
  	    key: 'formats',
  	    value: function formats(domNode) {
  	      if (domNode.tagName === 'OL') return 'ordered';
  	      if (domNode.tagName === 'UL') {
  	        if (domNode.hasAttribute('data-checked')) {
  	          return domNode.getAttribute('data-checked') === 'true' ? 'checked' : 'unchecked';
  	        } else {
  	          return 'bullet';
  	        }
  	      }
  	      return undefined;
  	    }
  	  }]);

  	  function List(domNode) {
  	    _classCallCheck(this, List);

  	    var _this2 = _possibleConstructorReturn(this, (List.__proto__ || Object.getPrototypeOf(List)).call(this, domNode));

  	    var listEventHandler = function listEventHandler(e) {
  	      if (e.target.parentNode !== domNode) return;
  	      var format = _this2.statics.formats(domNode);
  	      var blot = _parchment2.default.find(e.target);
  	      if (format === 'checked') {
  	        blot.format('list', 'unchecked');
  	      } else if (format === 'unchecked') {
  	        blot.format('list', 'checked');
  	      }
  	    };

  	    domNode.addEventListener('touchstart', listEventHandler);
  	    domNode.addEventListener('mousedown', listEventHandler);
  	    return _this2;
  	  }

  	  _createClass(List, [{
  	    key: 'format',
  	    value: function format(name, value) {
  	      if (this.children.length > 0) {
  	        this.children.tail.format(name, value);
  	      }
  	    }
  	  }, {
  	    key: 'formats',
  	    value: function formats() {
  	      // We don't inherit from FormatBlot
  	      return _defineProperty({}, this.statics.blotName, this.statics.formats(this.domNode));
  	    }
  	  }, {
  	    key: 'insertBefore',
  	    value: function insertBefore(blot, ref) {
  	      if (blot instanceof ListItem) {
  	        _get(List.prototype.__proto__ || Object.getPrototypeOf(List.prototype), 'insertBefore', this).call(this, blot, ref);
  	      } else {
  	        var index = ref == null ? this.length() : ref.offset(this);
  	        var after = this.split(index);
  	        after.parent.insertBefore(blot, after);
  	      }
  	    }
  	  }, {
  	    key: 'optimize',
  	    value: function optimize(context) {
  	      _get(List.prototype.__proto__ || Object.getPrototypeOf(List.prototype), 'optimize', this).call(this, context);
  	      var next = this.next;
  	      if (next != null && next.prev === this && next.statics.blotName === this.statics.blotName && next.domNode.tagName === this.domNode.tagName && next.domNode.getAttribute('data-checked') === this.domNode.getAttribute('data-checked')) {
  	        next.moveChildren(this);
  	        next.remove();
  	      }
  	    }
  	  }, {
  	    key: 'replace',
  	    value: function replace(target) {
  	      if (target.statics.blotName !== this.statics.blotName) {
  	        var item = _parchment2.default.create(this.statics.defaultChild);
  	        target.moveChildren(item);
  	        this.appendChild(item);
  	      }
  	      _get(List.prototype.__proto__ || Object.getPrototypeOf(List.prototype), 'replace', this).call(this, target);
  	    }
  	  }]);

  	  return List;
  	}(_container2.default);

  	List.blotName = 'list';
  	List.scope = _parchment2.default.Scope.BLOCK_BLOT;
  	List.tagName = ['OL', 'UL'];
  	List.defaultChild = 'list-item';
  	List.allowedChildren = [ListItem];

  	exports.ListItem = ListItem;
  	exports.default = List;

  	/***/ }),
  	/* 68 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _bold = __webpack_require__(56);

  	var _bold2 = _interopRequireDefault(_bold);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var Italic = function (_Bold) {
  	  _inherits(Italic, _Bold);

  	  function Italic() {
  	    _classCallCheck(this, Italic);

  	    return _possibleConstructorReturn(this, (Italic.__proto__ || Object.getPrototypeOf(Italic)).apply(this, arguments));
  	  }

  	  return Italic;
  	}(_bold2.default);

  	Italic.blotName = 'italic';
  	Italic.tagName = ['EM', 'I'];

  	exports.default = Italic;

  	/***/ }),
  	/* 69 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _inline = __webpack_require__(6);

  	var _inline2 = _interopRequireDefault(_inline);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var Script = function (_Inline) {
  	  _inherits(Script, _Inline);

  	  function Script() {
  	    _classCallCheck(this, Script);

  	    return _possibleConstructorReturn(this, (Script.__proto__ || Object.getPrototypeOf(Script)).apply(this, arguments));
  	  }

  	  _createClass(Script, null, [{
  	    key: 'create',
  	    value: function create(value) {
  	      if (value === 'super') {
  	        return document.createElement('sup');
  	      } else if (value === 'sub') {
  	        return document.createElement('sub');
  	      } else {
  	        return _get(Script.__proto__ || Object.getPrototypeOf(Script), 'create', this).call(this, value);
  	      }
  	    }
  	  }, {
  	    key: 'formats',
  	    value: function formats(domNode) {
  	      if (domNode.tagName === 'SUB') return 'sub';
  	      if (domNode.tagName === 'SUP') return 'super';
  	      return undefined;
  	    }
  	  }]);

  	  return Script;
  	}(_inline2.default);

  	Script.blotName = 'script';
  	Script.tagName = ['SUB', 'SUP'];

  	exports.default = Script;

  	/***/ }),
  	/* 70 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _inline = __webpack_require__(6);

  	var _inline2 = _interopRequireDefault(_inline);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var Strike = function (_Inline) {
  	  _inherits(Strike, _Inline);

  	  function Strike() {
  	    _classCallCheck(this, Strike);

  	    return _possibleConstructorReturn(this, (Strike.__proto__ || Object.getPrototypeOf(Strike)).apply(this, arguments));
  	  }

  	  return Strike;
  	}(_inline2.default);

  	Strike.blotName = 'strike';
  	Strike.tagName = 'S';

  	exports.default = Strike;

  	/***/ }),
  	/* 71 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _inline = __webpack_require__(6);

  	var _inline2 = _interopRequireDefault(_inline);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var Underline = function (_Inline) {
  	  _inherits(Underline, _Inline);

  	  function Underline() {
  	    _classCallCheck(this, Underline);

  	    return _possibleConstructorReturn(this, (Underline.__proto__ || Object.getPrototypeOf(Underline)).apply(this, arguments));
  	  }

  	  return Underline;
  	}(_inline2.default);

  	Underline.blotName = 'underline';
  	Underline.tagName = 'U';

  	exports.default = Underline;

  	/***/ }),
  	/* 72 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _link = __webpack_require__(27);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var ATTRIBUTES = ['alt', 'height', 'width'];

  	var Image = function (_Parchment$Embed) {
  	  _inherits(Image, _Parchment$Embed);

  	  function Image() {
  	    _classCallCheck(this, Image);

  	    return _possibleConstructorReturn(this, (Image.__proto__ || Object.getPrototypeOf(Image)).apply(this, arguments));
  	  }

  	  _createClass(Image, [{
  	    key: 'format',
  	    value: function format(name, value) {
  	      if (ATTRIBUTES.indexOf(name) > -1) {
  	        if (value) {
  	          this.domNode.setAttribute(name, value);
  	        } else {
  	          this.domNode.removeAttribute(name);
  	        }
  	      } else {
  	        _get(Image.prototype.__proto__ || Object.getPrototypeOf(Image.prototype), 'format', this).call(this, name, value);
  	      }
  	    }
  	  }], [{
  	    key: 'create',
  	    value: function create(value) {
  	      var node = _get(Image.__proto__ || Object.getPrototypeOf(Image), 'create', this).call(this, value);
  	      if (typeof value === 'string') {
  	        node.setAttribute('src', this.sanitize(value));
  	      }
  	      return node;
  	    }
  	  }, {
  	    key: 'formats',
  	    value: function formats(domNode) {
  	      return ATTRIBUTES.reduce(function (formats, attribute) {
  	        if (domNode.hasAttribute(attribute)) {
  	          formats[attribute] = domNode.getAttribute(attribute);
  	        }
  	        return formats;
  	      }, {});
  	    }
  	  }, {
  	    key: 'match',
  	    value: function match(url) {
  	      return (/\.(jpe?g|gif|png)$/.test(url) || /^data:image\/.+;base64/.test(url)
  	      );
  	    }
  	  }, {
  	    key: 'sanitize',
  	    value: function sanitize(url) {
  	      return (0, _link.sanitize)(url, ['http', 'https', 'data']) ? url : '//:0';
  	    }
  	  }, {
  	    key: 'value',
  	    value: function value(domNode) {
  	      return domNode.getAttribute('src');
  	    }
  	  }]);

  	  return Image;
  	}(_parchment2.default.Embed);

  	Image.blotName = 'image';
  	Image.tagName = 'IMG';

  	exports.default = Image;

  	/***/ }),
  	/* 73 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _block = __webpack_require__(4);

  	var _link = __webpack_require__(27);

  	var _link2 = _interopRequireDefault(_link);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var ATTRIBUTES = ['height', 'width'];

  	var Video = function (_BlockEmbed) {
  	  _inherits(Video, _BlockEmbed);

  	  function Video() {
  	    _classCallCheck(this, Video);

  	    return _possibleConstructorReturn(this, (Video.__proto__ || Object.getPrototypeOf(Video)).apply(this, arguments));
  	  }

  	  _createClass(Video, [{
  	    key: 'format',
  	    value: function format(name, value) {
  	      if (ATTRIBUTES.indexOf(name) > -1) {
  	        if (value) {
  	          this.domNode.setAttribute(name, value);
  	        } else {
  	          this.domNode.removeAttribute(name);
  	        }
  	      } else {
  	        _get(Video.prototype.__proto__ || Object.getPrototypeOf(Video.prototype), 'format', this).call(this, name, value);
  	      }
  	    }
  	  }], [{
  	    key: 'create',
  	    value: function create(value) {
  	      var node = _get(Video.__proto__ || Object.getPrototypeOf(Video), 'create', this).call(this, value);
  	      node.setAttribute('frameborder', '0');
  	      node.setAttribute('allowfullscreen', true);
  	      node.setAttribute('src', this.sanitize(value));
  	      return node;
  	    }
  	  }, {
  	    key: 'formats',
  	    value: function formats(domNode) {
  	      return ATTRIBUTES.reduce(function (formats, attribute) {
  	        if (domNode.hasAttribute(attribute)) {
  	          formats[attribute] = domNode.getAttribute(attribute);
  	        }
  	        return formats;
  	      }, {});
  	    }
  	  }, {
  	    key: 'sanitize',
  	    value: function sanitize(url) {
  	      return _link2.default.sanitize(url);
  	    }
  	  }, {
  	    key: 'value',
  	    value: function value(domNode) {
  	      return domNode.getAttribute('src');
  	    }
  	  }]);

  	  return Video;
  	}(_block.BlockEmbed);

  	Video.blotName = 'video';
  	Video.className = 'ql-video';
  	Video.tagName = 'IFRAME';

  	exports.default = Video;

  	/***/ }),
  	/* 74 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.default = exports.FormulaBlot = undefined;

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _embed = __webpack_require__(35);

  	var _embed2 = _interopRequireDefault(_embed);

  	var _quill = __webpack_require__(5);

  	var _quill2 = _interopRequireDefault(_quill);

  	var _module = __webpack_require__(9);

  	var _module2 = _interopRequireDefault(_module);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var FormulaBlot = function (_Embed) {
  	  _inherits(FormulaBlot, _Embed);

  	  function FormulaBlot() {
  	    _classCallCheck(this, FormulaBlot);

  	    return _possibleConstructorReturn(this, (FormulaBlot.__proto__ || Object.getPrototypeOf(FormulaBlot)).apply(this, arguments));
  	  }

  	  _createClass(FormulaBlot, null, [{
  	    key: 'create',
  	    value: function create(value) {
  	      var node = _get(FormulaBlot.__proto__ || Object.getPrototypeOf(FormulaBlot), 'create', this).call(this, value);
  	      if (typeof value === 'string') {
  	        window.katex.render(value, node, {
  	          throwOnError: false,
  	          errorColor: '#f00'
  	        });
  	        node.setAttribute('data-value', value);
  	      }
  	      return node;
  	    }
  	  }, {
  	    key: 'value',
  	    value: function value(domNode) {
  	      return domNode.getAttribute('data-value');
  	    }
  	  }]);

  	  return FormulaBlot;
  	}(_embed2.default);

  	FormulaBlot.blotName = 'formula';
  	FormulaBlot.className = 'ql-formula';
  	FormulaBlot.tagName = 'SPAN';

  	var Formula = function (_Module) {
  	  _inherits(Formula, _Module);

  	  _createClass(Formula, null, [{
  	    key: 'register',
  	    value: function register() {
  	      _quill2.default.register(FormulaBlot, true);
  	    }
  	  }]);

  	  function Formula() {
  	    _classCallCheck(this, Formula);

  	    var _this2 = _possibleConstructorReturn(this, (Formula.__proto__ || Object.getPrototypeOf(Formula)).call(this));

  	    if (window.katex == null) {
  	      throw new Error('Formula module requires KaTeX.');
  	    }
  	    return _this2;
  	  }

  	  return Formula;
  	}(_module2.default);

  	exports.FormulaBlot = FormulaBlot;
  	exports.default = Formula;

  	/***/ }),
  	/* 75 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.default = exports.CodeToken = exports.CodeBlock = undefined;

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _parchment = __webpack_require__(0);

  	var _parchment2 = _interopRequireDefault(_parchment);

  	var _quill = __webpack_require__(5);

  	var _quill2 = _interopRequireDefault(_quill);

  	var _module = __webpack_require__(9);

  	var _module2 = _interopRequireDefault(_module);

  	var _code = __webpack_require__(13);

  	var _code2 = _interopRequireDefault(_code);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var SyntaxCodeBlock = function (_CodeBlock) {
  	  _inherits(SyntaxCodeBlock, _CodeBlock);

  	  function SyntaxCodeBlock() {
  	    _classCallCheck(this, SyntaxCodeBlock);

  	    return _possibleConstructorReturn(this, (SyntaxCodeBlock.__proto__ || Object.getPrototypeOf(SyntaxCodeBlock)).apply(this, arguments));
  	  }

  	  _createClass(SyntaxCodeBlock, [{
  	    key: 'replaceWith',
  	    value: function replaceWith(block) {
  	      this.domNode.textContent = this.domNode.textContent;
  	      this.attach();
  	      _get(SyntaxCodeBlock.prototype.__proto__ || Object.getPrototypeOf(SyntaxCodeBlock.prototype), 'replaceWith', this).call(this, block);
  	    }
  	  }, {
  	    key: 'highlight',
  	    value: function highlight(_highlight) {
  	      var text = this.domNode.textContent;
  	      if (this.cachedText !== text) {
  	        if (text.trim().length > 0 || this.cachedText == null) {
  	          this.domNode.innerHTML = _highlight(text);
  	          this.domNode.normalize();
  	          this.attach();
  	        }
  	        this.cachedText = text;
  	      }
  	    }
  	  }]);

  	  return SyntaxCodeBlock;
  	}(_code2.default);

  	SyntaxCodeBlock.className = 'ql-syntax';

  	var CodeToken = new _parchment2.default.Attributor.Class('token', 'hljs', {
  	  scope: _parchment2.default.Scope.INLINE
  	});

  	var Syntax = function (_Module) {
  	  _inherits(Syntax, _Module);

  	  _createClass(Syntax, null, [{
  	    key: 'register',
  	    value: function register() {
  	      _quill2.default.register(CodeToken, true);
  	      _quill2.default.register(SyntaxCodeBlock, true);
  	    }
  	  }]);

  	  function Syntax(quill, options) {
  	    _classCallCheck(this, Syntax);

  	    var _this2 = _possibleConstructorReturn(this, (Syntax.__proto__ || Object.getPrototypeOf(Syntax)).call(this, quill, options));

  	    if (typeof _this2.options.highlight !== 'function') {
  	      throw new Error('Syntax module requires highlight.js. Please include the library on the page before Quill.');
  	    }
  	    var timer = null;
  	    _this2.quill.on(_quill2.default.events.SCROLL_OPTIMIZE, function () {
  	      clearTimeout(timer);
  	      timer = setTimeout(function () {
  	        _this2.highlight();
  	        timer = null;
  	      }, _this2.options.interval);
  	    });
  	    _this2.highlight();
  	    return _this2;
  	  }

  	  _createClass(Syntax, [{
  	    key: 'highlight',
  	    value: function highlight() {
  	      var _this3 = this;

  	      if (this.quill.selection.composing) return;
  	      this.quill.update(_quill2.default.sources.USER);
  	      var range = this.quill.getSelection();
  	      this.quill.scroll.descendants(SyntaxCodeBlock).forEach(function (code) {
  	        code.highlight(_this3.options.highlight);
  	      });
  	      this.quill.update(_quill2.default.sources.SILENT);
  	      if (range != null) {
  	        this.quill.setSelection(range, _quill2.default.sources.SILENT);
  	      }
  	    }
  	  }]);

  	  return Syntax;
  	}(_module2.default);

  	Syntax.DEFAULTS = {
  	  highlight: function () {
  	    if (window.hljs == null) return null;
  	    return function (text) {
  	      var result = window.hljs.highlightAuto(text);
  	      return result.value;
  	    };
  	  }(),
  	  interval: 1000
  	};

  	exports.CodeBlock = SyntaxCodeBlock;
  	exports.CodeToken = CodeToken;
  	exports.default = Syntax;

  	/***/ }),
  	/* 76 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=3 x2=15 y1=9 y2=9></line> <line class=ql-stroke x1=3 x2=13 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=9 y1=4 y2=4></line> </svg>";

  	/***/ }),
  	/* 77 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=15 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=14 x2=4 y1=14 y2=14></line> <line class=ql-stroke x1=12 x2=6 y1=4 y2=4></line> </svg>";

  	/***/ }),
  	/* 78 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=15 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=15 x2=5 y1=14 y2=14></line> <line class=ql-stroke x1=15 x2=9 y1=4 y2=4></line> </svg>";

  	/***/ }),
  	/* 79 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=15 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=15 x2=3 y1=14 y2=14></line> <line class=ql-stroke x1=15 x2=3 y1=4 y2=4></line> </svg>";

  	/***/ }),
  	/* 80 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <g class=\"ql-fill ql-color-label\"> <polygon points=\"6 6.868 6 6 5 6 5 7 5.942 7 6 6.868\"></polygon> <rect height=1 width=1 x=4 y=4></rect> <polygon points=\"6.817 5 6 5 6 6 6.38 6 6.817 5\"></polygon> <rect height=1 width=1 x=2 y=6></rect> <rect height=1 width=1 x=3 y=5></rect> <rect height=1 width=1 x=4 y=7></rect> <polygon points=\"4 11.439 4 11 3 11 3 12 3.755 12 4 11.439\"></polygon> <rect height=1 width=1 x=2 y=12></rect> <rect height=1 width=1 x=2 y=9></rect> <rect height=1 width=1 x=2 y=15></rect> <polygon points=\"4.63 10 4 10 4 11 4.192 11 4.63 10\"></polygon> <rect height=1 width=1 x=3 y=8></rect> <path d=M10.832,4.2L11,4.582V4H10.708A1.948,1.948,0,0,1,10.832,4.2Z></path> <path d=M7,4.582L7.168,4.2A1.929,1.929,0,0,1,7.292,4H7V4.582Z></path> <path d=M8,13H7.683l-0.351.8a1.933,1.933,0,0,1-.124.2H8V13Z></path> <rect height=1 width=1 x=12 y=2></rect> <rect height=1 width=1 x=11 y=3></rect> <path d=M9,3H8V3.282A1.985,1.985,0,0,1,9,3Z></path> <rect height=1 width=1 x=2 y=3></rect> <rect height=1 width=1 x=6 y=2></rect> <rect height=1 width=1 x=3 y=2></rect> <rect height=1 width=1 x=5 y=3></rect> <rect height=1 width=1 x=9 y=2></rect> <rect height=1 width=1 x=15 y=14></rect> <polygon points=\"13.447 10.174 13.469 10.225 13.472 10.232 13.808 11 14 11 14 10 13.37 10 13.447 10.174\"></polygon> <rect height=1 width=1 x=13 y=7></rect> <rect height=1 width=1 x=15 y=5></rect> <rect height=1 width=1 x=14 y=6></rect> <rect height=1 width=1 x=15 y=8></rect> <rect height=1 width=1 x=14 y=9></rect> <path d=M3.775,14H3v1H4V14.314A1.97,1.97,0,0,1,3.775,14Z></path> <rect height=1 width=1 x=14 y=3></rect> <polygon points=\"12 6.868 12 6 11.62 6 12 6.868\"></polygon> <rect height=1 width=1 x=15 y=2></rect> <rect height=1 width=1 x=12 y=5></rect> <rect height=1 width=1 x=13 y=4></rect> <polygon points=\"12.933 9 13 9 13 8 12.495 8 12.933 9\"></polygon> <rect height=1 width=1 x=9 y=14></rect> <rect height=1 width=1 x=8 y=15></rect> <path d=M6,14.926V15H7V14.316A1.993,1.993,0,0,1,6,14.926Z></path> <rect height=1 width=1 x=5 y=15></rect> <path d=M10.668,13.8L10.317,13H10v1h0.792A1.947,1.947,0,0,1,10.668,13.8Z></path> <rect height=1 width=1 x=11 y=15></rect> <path d=M14.332,12.2a1.99,1.99,0,0,1,.166.8H15V12H14.245Z></path> <rect height=1 width=1 x=14 y=15></rect> <rect height=1 width=1 x=15 y=11></rect> </g> <polyline class=ql-stroke points=\"5.5 13 9 5 12.5 13\"></polyline> <line class=ql-stroke x1=11.63 x2=6.38 y1=11 y2=11></line> </svg>";

  	/***/ }),
  	/* 81 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <rect class=\"ql-fill ql-stroke\" height=3 width=3 x=4 y=5></rect> <rect class=\"ql-fill ql-stroke\" height=3 width=3 x=11 y=5></rect> <path class=\"ql-even ql-fill ql-stroke\" d=M7,8c0,4.031-3,5-3,5></path> <path class=\"ql-even ql-fill ql-stroke\" d=M14,8c0,4.031-3,5-3,5></path> </svg>";

  	/***/ }),
  	/* 82 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-stroke d=M5,4H9.5A2.5,2.5,0,0,1,12,6.5v0A2.5,2.5,0,0,1,9.5,9H5A0,0,0,0,1,5,9V4A0,0,0,0,1,5,4Z></path> <path class=ql-stroke d=M5,9h5.5A2.5,2.5,0,0,1,13,11.5v0A2.5,2.5,0,0,1,10.5,14H5a0,0,0,0,1,0,0V9A0,0,0,0,1,5,9Z></path> </svg>";

  	/***/ }),
  	/* 83 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg class=\"\" viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=5 x2=13 y1=3 y2=3></line> <line class=ql-stroke x1=6 x2=9.35 y1=12 y2=3></line> <line class=ql-stroke x1=11 x2=15 y1=11 y2=15></line> <line class=ql-stroke x1=15 x2=11 y1=11 y2=15></line> <rect class=ql-fill height=1 rx=0.5 ry=0.5 width=7 x=2 y=14></rect> </svg>";

  	/***/ }),
  	/* 84 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=\"ql-color-label ql-stroke ql-transparent\" x1=3 x2=15 y1=15 y2=15></line> <polyline class=ql-stroke points=\"5.5 11 9 3 12.5 11\"></polyline> <line class=ql-stroke x1=11.63 x2=6.38 y1=9 y2=9></line> </svg>";

  	/***/ }),
  	/* 85 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <polygon class=\"ql-stroke ql-fill\" points=\"3 11 5 9 3 7 3 11\"></polygon> <line class=\"ql-stroke ql-fill\" x1=15 x2=11 y1=4 y2=4></line> <path class=ql-fill d=M11,3a3,3,0,0,0,0,6h1V3H11Z></path> <rect class=ql-fill height=11 width=1 x=11 y=4></rect> <rect class=ql-fill height=11 width=1 x=13 y=4></rect> </svg>";

  	/***/ }),
  	/* 86 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <polygon class=\"ql-stroke ql-fill\" points=\"15 12 13 10 15 8 15 12\"></polygon> <line class=\"ql-stroke ql-fill\" x1=9 x2=5 y1=4 y2=4></line> <path class=ql-fill d=M5,3A3,3,0,0,0,5,9H6V3H5Z></path> <rect class=ql-fill height=11 width=1 x=5 y=4></rect> <rect class=ql-fill height=11 width=1 x=7 y=4></rect> </svg>";

  	/***/ }),
  	/* 87 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M14,16H4a1,1,0,0,1,0-2H14A1,1,0,0,1,14,16Z /> <path class=ql-fill d=M14,4H4A1,1,0,0,1,4,2H14A1,1,0,0,1,14,4Z /> <rect class=ql-fill x=3 y=6 width=12 height=6 rx=1 ry=1 /> </svg>";

  	/***/ }),
  	/* 88 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M13,16H5a1,1,0,0,1,0-2h8A1,1,0,0,1,13,16Z /> <path class=ql-fill d=M13,4H5A1,1,0,0,1,5,2h8A1,1,0,0,1,13,4Z /> <rect class=ql-fill x=2 y=6 width=14 height=6 rx=1 ry=1 /> </svg>";

  	/***/ }),
  	/* 89 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M15,8H13a1,1,0,0,1,0-2h2A1,1,0,0,1,15,8Z /> <path class=ql-fill d=M15,12H13a1,1,0,0,1,0-2h2A1,1,0,0,1,15,12Z /> <path class=ql-fill d=M15,16H5a1,1,0,0,1,0-2H15A1,1,0,0,1,15,16Z /> <path class=ql-fill d=M15,4H5A1,1,0,0,1,5,2H15A1,1,0,0,1,15,4Z /> <rect class=ql-fill x=2 y=6 width=8 height=6 rx=1 ry=1 /> </svg>";

  	/***/ }),
  	/* 90 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M5,8H3A1,1,0,0,1,3,6H5A1,1,0,0,1,5,8Z /> <path class=ql-fill d=M5,12H3a1,1,0,0,1,0-2H5A1,1,0,0,1,5,12Z /> <path class=ql-fill d=M13,16H3a1,1,0,0,1,0-2H13A1,1,0,0,1,13,16Z /> <path class=ql-fill d=M13,4H3A1,1,0,0,1,3,2H13A1,1,0,0,1,13,4Z /> <rect class=ql-fill x=8 y=6 width=8 height=6 rx=1 ry=1 transform=\"translate(24 18) rotate(-180)\"/> </svg>";

  	/***/ }),
  	/* 91 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M11.759,2.482a2.561,2.561,0,0,0-3.53.607A7.656,7.656,0,0,0,6.8,6.2C6.109,9.188,5.275,14.677,4.15,14.927a1.545,1.545,0,0,0-1.3-.933A0.922,0.922,0,0,0,2,15.036S1.954,16,4.119,16s3.091-2.691,3.7-5.553c0.177-.826.36-1.726,0.554-2.6L8.775,6.2c0.381-1.421.807-2.521,1.306-2.676a1.014,1.014,0,0,0,1.02.56A0.966,0.966,0,0,0,11.759,2.482Z></path> <rect class=ql-fill height=1.6 rx=0.8 ry=0.8 width=5 x=5.15 y=6.2></rect> <path class=ql-fill d=M13.663,12.027a1.662,1.662,0,0,1,.266-0.276q0.193,0.069.456,0.138a2.1,2.1,0,0,0,.535.069,1.075,1.075,0,0,0,.767-0.3,1.044,1.044,0,0,0,.314-0.8,0.84,0.84,0,0,0-.238-0.619,0.8,0.8,0,0,0-.594-0.239,1.154,1.154,0,0,0-.781.3,4.607,4.607,0,0,0-.781,1q-0.091.15-.218,0.346l-0.246.38c-0.068-.288-0.137-0.582-0.212-0.885-0.459-1.847-2.494-.984-2.941-0.8-0.482.2-.353,0.647-0.094,0.529a0.869,0.869,0,0,1,1.281.585c0.217,0.751.377,1.436,0.527,2.038a5.688,5.688,0,0,1-.362.467,2.69,2.69,0,0,1-.264.271q-0.221-.08-0.471-0.147a2.029,2.029,0,0,0-.522-0.066,1.079,1.079,0,0,0-.768.3A1.058,1.058,0,0,0,9,15.131a0.82,0.82,0,0,0,.832.852,1.134,1.134,0,0,0,.787-0.3,5.11,5.11,0,0,0,.776-0.993q0.141-.219.215-0.34c0.046-.076.122-0.194,0.223-0.346a2.786,2.786,0,0,0,.918,1.726,2.582,2.582,0,0,0,2.376-.185c0.317-.181.212-0.565,0-0.494A0.807,0.807,0,0,1,14.176,15a5.159,5.159,0,0,1-.913-2.446l0,0Q13.487,12.24,13.663,12.027Z></path> </svg>";

  	/***/ }),
  	/* 92 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewBox=\"0 0 18 18\"> <path class=ql-fill d=M10,4V14a1,1,0,0,1-2,0V10H3v4a1,1,0,0,1-2,0V4A1,1,0,0,1,3,4V8H8V4a1,1,0,0,1,2,0Zm6.06787,9.209H14.98975V7.59863a.54085.54085,0,0,0-.605-.60547h-.62744a1.01119,1.01119,0,0,0-.748.29688L11.645,8.56641a.5435.5435,0,0,0-.022.8584l.28613.30762a.53861.53861,0,0,0,.84717.0332l.09912-.08789a1.2137,1.2137,0,0,0,.2417-.35254h.02246s-.01123.30859-.01123.60547V13.209H12.041a.54085.54085,0,0,0-.605.60547v.43945a.54085.54085,0,0,0,.605.60547h4.02686a.54085.54085,0,0,0,.605-.60547v-.43945A.54085.54085,0,0,0,16.06787,13.209Z /> </svg>";

  	/***/ }),
  	/* 93 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewBox=\"0 0 18 18\"> <path class=ql-fill d=M16.73975,13.81445v.43945a.54085.54085,0,0,1-.605.60547H11.855a.58392.58392,0,0,1-.64893-.60547V14.0127c0-2.90527,3.39941-3.42187,3.39941-4.55469a.77675.77675,0,0,0-.84717-.78125,1.17684,1.17684,0,0,0-.83594.38477c-.2749.26367-.561.374-.85791.13184l-.4292-.34082c-.30811-.24219-.38525-.51758-.1543-.81445a2.97155,2.97155,0,0,1,2.45361-1.17676,2.45393,2.45393,0,0,1,2.68408,2.40918c0,2.45312-3.1792,2.92676-3.27832,3.93848h2.79443A.54085.54085,0,0,1,16.73975,13.81445ZM9,3A.99974.99974,0,0,0,8,4V8H3V4A1,1,0,0,0,1,4V14a1,1,0,0,0,2,0V10H8v4a1,1,0,0,0,2,0V4A.99974.99974,0,0,0,9,3Z /> </svg>";

  	/***/ }),
  	/* 94 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=7 x2=13 y1=4 y2=4></line> <line class=ql-stroke x1=5 x2=11 y1=14 y2=14></line> <line class=ql-stroke x1=8 x2=10 y1=14 y2=4></line> </svg>";

  	/***/ }),
  	/* 95 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <rect class=ql-stroke height=10 width=12 x=3 y=4></rect> <circle class=ql-fill cx=6 cy=7 r=1></circle> <polyline class=\"ql-even ql-fill\" points=\"5 12 5 11 7 9 8 10 11 7 13 9 13 12 5 12\"></polyline> </svg>";

  	/***/ }),
  	/* 96 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=3 x2=15 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=9 x2=15 y1=9 y2=9></line> <polyline class=\"ql-fill ql-stroke\" points=\"3 7 3 11 5 9 3 7\"></polyline> </svg>";

  	/***/ }),
  	/* 97 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=3 x2=15 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=9 x2=15 y1=9 y2=9></line> <polyline class=ql-stroke points=\"5 7 5 11 3 9 5 7\"></polyline> </svg>";

  	/***/ }),
  	/* 98 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=7 x2=11 y1=7 y2=11></line> <path class=\"ql-even ql-stroke\" d=M8.9,4.577a3.476,3.476,0,0,1,.36,4.679A3.476,3.476,0,0,1,4.577,8.9C3.185,7.5,2.035,6.4,4.217,4.217S7.5,3.185,8.9,4.577Z></path> <path class=\"ql-even ql-stroke\" d=M13.423,9.1a3.476,3.476,0,0,0-4.679-.36,3.476,3.476,0,0,0,.36,4.679c1.392,1.392,2.5,2.542,4.679.36S14.815,10.5,13.423,9.1Z></path> </svg>";

  	/***/ }),
  	/* 99 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=7 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=7 x2=15 y1=9 y2=9></line> <line class=ql-stroke x1=7 x2=15 y1=14 y2=14></line> <line class=\"ql-stroke ql-thin\" x1=2.5 x2=4.5 y1=5.5 y2=5.5></line> <path class=ql-fill d=M3.5,6A0.5,0.5,0,0,1,3,5.5V3.085l-0.276.138A0.5,0.5,0,0,1,2.053,3c-0.124-.247-0.023-0.324.224-0.447l1-.5A0.5,0.5,0,0,1,4,2.5v3A0.5,0.5,0,0,1,3.5,6Z></path> <path class=\"ql-stroke ql-thin\" d=M4.5,10.5h-2c0-.234,1.85-1.076,1.85-2.234A0.959,0.959,0,0,0,2.5,8.156></path> <path class=\"ql-stroke ql-thin\" d=M2.5,14.846a0.959,0.959,0,0,0,1.85-.109A0.7,0.7,0,0,0,3.75,14a0.688,0.688,0,0,0,.6-0.736,0.959,0.959,0,0,0-1.85-.109></path> </svg>";

  	/***/ }),
  	/* 100 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=6 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=6 x2=15 y1=9 y2=9></line> <line class=ql-stroke x1=6 x2=15 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=3 y1=4 y2=4></line> <line class=ql-stroke x1=3 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=3 x2=3 y1=14 y2=14></line> </svg>";

  	/***/ }),
  	/* 101 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg class=\"\" viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=9 x2=15 y1=4 y2=4></line> <polyline class=ql-stroke points=\"3 4 4 5 6 3\"></polyline> <line class=ql-stroke x1=9 x2=15 y1=14 y2=14></line> <polyline class=ql-stroke points=\"3 14 4 15 6 13\"></polyline> <line class=ql-stroke x1=9 x2=15 y1=9 y2=9></line> <polyline class=ql-stroke points=\"3 9 4 10 6 8\"></polyline> </svg>";

  	/***/ }),
  	/* 102 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M15.5,15H13.861a3.858,3.858,0,0,0,1.914-2.975,1.8,1.8,0,0,0-1.6-1.751A1.921,1.921,0,0,0,12.021,11.7a0.50013,0.50013,0,1,0,.957.291h0a0.914,0.914,0,0,1,1.053-.725,0.81,0.81,0,0,1,.744.762c0,1.076-1.16971,1.86982-1.93971,2.43082A1.45639,1.45639,0,0,0,12,15.5a0.5,0.5,0,0,0,.5.5h3A0.5,0.5,0,0,0,15.5,15Z /> <path class=ql-fill d=M9.65,5.241a1,1,0,0,0-1.409.108L6,7.964,3.759,5.349A1,1,0,0,0,2.192,6.59178Q2.21541,6.6213,2.241,6.649L4.684,9.5,2.241,12.35A1,1,0,0,0,3.71,13.70722q0.02557-.02768.049-0.05722L6,11.036,8.241,13.65a1,1,0,1,0,1.567-1.24277Q9.78459,12.3777,9.759,12.35L7.316,9.5,9.759,6.651A1,1,0,0,0,9.65,5.241Z /> </svg>";

  	/***/ }),
  	/* 103 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M15.5,7H13.861a4.015,4.015,0,0,0,1.914-2.975,1.8,1.8,0,0,0-1.6-1.751A1.922,1.922,0,0,0,12.021,3.7a0.5,0.5,0,1,0,.957.291,0.917,0.917,0,0,1,1.053-.725,0.81,0.81,0,0,1,.744.762c0,1.077-1.164,1.925-1.934,2.486A1.423,1.423,0,0,0,12,7.5a0.5,0.5,0,0,0,.5.5h3A0.5,0.5,0,0,0,15.5,7Z /> <path class=ql-fill d=M9.651,5.241a1,1,0,0,0-1.41.108L6,7.964,3.759,5.349a1,1,0,1,0-1.519,1.3L4.683,9.5,2.241,12.35a1,1,0,1,0,1.519,1.3L6,11.036,8.241,13.65a1,1,0,0,0,1.519-1.3L7.317,9.5,9.759,6.651A1,1,0,0,0,9.651,5.241Z /> </svg>";

  	/***/ }),
  	/* 104 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=\"ql-stroke ql-thin\" x1=15.5 x2=2.5 y1=8.5 y2=9.5></line> <path class=ql-fill d=M9.007,8C6.542,7.791,6,7.519,6,6.5,6,5.792,7.283,5,9,5c1.571,0,2.765.679,2.969,1.309a1,1,0,0,0,1.9-.617C13.356,4.106,11.354,3,9,3,6.2,3,4,4.538,4,6.5a3.2,3.2,0,0,0,.5,1.843Z></path> <path class=ql-fill d=M8.984,10C11.457,10.208,12,10.479,12,11.5c0,0.708-1.283,1.5-3,1.5-1.571,0-2.765-.679-2.969-1.309a1,1,0,1,0-1.9.617C4.644,13.894,6.646,15,9,15c2.8,0,5-1.538,5-3.5a3.2,3.2,0,0,0-.5-1.843Z></path> </svg>";

  	/***/ }),
  	/* 105 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-stroke d=M5,3V9a4.012,4.012,0,0,0,4,4H9a4.012,4.012,0,0,0,4-4V3></path> <rect class=ql-fill height=1 rx=0.5 ry=0.5 width=12 x=3 y=15></rect> </svg>";

  	/***/ }),
  	/* 106 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <rect class=ql-stroke height=12 width=12 x=3 y=3></rect> <rect class=ql-fill height=12 width=1 x=5 y=3></rect> <rect class=ql-fill height=12 width=1 x=12 y=3></rect> <rect class=ql-fill height=2 width=8 x=5 y=8></rect> <rect class=ql-fill height=1 width=3 x=3 y=5></rect> <rect class=ql-fill height=1 width=3 x=3 y=7></rect> <rect class=ql-fill height=1 width=3 x=3 y=10></rect> <rect class=ql-fill height=1 width=3 x=3 y=12></rect> <rect class=ql-fill height=1 width=3 x=12 y=5></rect> <rect class=ql-fill height=1 width=3 x=12 y=7></rect> <rect class=ql-fill height=1 width=3 x=12 y=10></rect> <rect class=ql-fill height=1 width=3 x=12 y=12></rect> </svg>";

  	/***/ }),
  	/* 107 */
  	/***/ (function(module, exports) {

  	module.exports = "<svg viewbox=\"0 0 18 18\"> <polygon class=ql-stroke points=\"7 11 9 13 11 11 7 11\"></polygon> <polygon class=ql-stroke points=\"7 7 9 5 11 7 7 7\"></polygon> </svg>";

  	/***/ }),
  	/* 108 */
  	/***/ (function(module, exports, __webpack_require__) {


  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports.default = exports.BubbleTooltip = undefined;

  	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  	var _extend = __webpack_require__(3);

  	var _extend2 = _interopRequireDefault(_extend);

  	var _emitter = __webpack_require__(8);

  	var _emitter2 = _interopRequireDefault(_emitter);

  	var _base = __webpack_require__(43);

  	var _base2 = _interopRequireDefault(_base);

  	var _selection = __webpack_require__(15);

  	var _icons = __webpack_require__(41);

  	var _icons2 = _interopRequireDefault(_icons);

  	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  	var TOOLBAR_CONFIG = [['bold', 'italic', 'link'], [{ header: 1 }, { header: 2 }, 'blockquote']];

  	var BubbleTheme = function (_BaseTheme) {
  	  _inherits(BubbleTheme, _BaseTheme);

  	  function BubbleTheme(quill, options) {
  	    _classCallCheck(this, BubbleTheme);

  	    if (options.modules.toolbar != null && options.modules.toolbar.container == null) {
  	      options.modules.toolbar.container = TOOLBAR_CONFIG;
  	    }

  	    var _this = _possibleConstructorReturn(this, (BubbleTheme.__proto__ || Object.getPrototypeOf(BubbleTheme)).call(this, quill, options));

  	    _this.quill.container.classList.add('ql-bubble');
  	    return _this;
  	  }

  	  _createClass(BubbleTheme, [{
  	    key: 'extendToolbar',
  	    value: function extendToolbar(toolbar) {
  	      this.tooltip = new BubbleTooltip(this.quill, this.options.bounds);
  	      this.tooltip.root.appendChild(toolbar.container);
  	      this.buildButtons([].slice.call(toolbar.container.querySelectorAll('button')), _icons2.default);
  	      this.buildPickers([].slice.call(toolbar.container.querySelectorAll('select')), _icons2.default);
  	    }
  	  }]);

  	  return BubbleTheme;
  	}(_base2.default);

  	BubbleTheme.DEFAULTS = (0, _extend2.default)(true, {}, _base2.default.DEFAULTS, {
  	  modules: {
  	    toolbar: {
  	      handlers: {
  	        link: function link(value) {
  	          if (!value) {
  	            this.quill.format('link', false);
  	          } else {
  	            this.quill.theme.tooltip.edit();
  	          }
  	        }
  	      }
  	    }
  	  }
  	});

  	var BubbleTooltip = function (_BaseTooltip) {
  	  _inherits(BubbleTooltip, _BaseTooltip);

  	  function BubbleTooltip(quill, bounds) {
  	    _classCallCheck(this, BubbleTooltip);

  	    var _this2 = _possibleConstructorReturn(this, (BubbleTooltip.__proto__ || Object.getPrototypeOf(BubbleTooltip)).call(this, quill, bounds));

  	    _this2.quill.on(_emitter2.default.events.EDITOR_CHANGE, function (type, range, oldRange, source) {
  	      if (type !== _emitter2.default.events.SELECTION_CHANGE) return;
  	      if (range != null && range.length > 0 && source === _emitter2.default.sources.USER) {
  	        _this2.show();
  	        // Lock our width so we will expand beyond our offsetParent boundaries
  	        _this2.root.style.left = '0px';
  	        _this2.root.style.width = '';
  	        _this2.root.style.width = _this2.root.offsetWidth + 'px';
  	        var lines = _this2.quill.getLines(range.index, range.length);
  	        if (lines.length === 1) {
  	          _this2.position(_this2.quill.getBounds(range));
  	        } else {
  	          var lastLine = lines[lines.length - 1];
  	          var index = _this2.quill.getIndex(lastLine);
  	          var length = Math.min(lastLine.length() - 1, range.index + range.length - index);
  	          var _bounds = _this2.quill.getBounds(new _selection.Range(index, length));
  	          _this2.position(_bounds);
  	        }
  	      } else if (document.activeElement !== _this2.textbox && _this2.quill.hasFocus()) {
  	        _this2.hide();
  	      }
  	    });
  	    return _this2;
  	  }

  	  _createClass(BubbleTooltip, [{
  	    key: 'listen',
  	    value: function listen() {
  	      var _this3 = this;

  	      _get(BubbleTooltip.prototype.__proto__ || Object.getPrototypeOf(BubbleTooltip.prototype), 'listen', this).call(this);
  	      this.root.querySelector('.ql-close').addEventListener('click', function () {
  	        _this3.root.classList.remove('ql-editing');
  	      });
  	      this.quill.on(_emitter2.default.events.SCROLL_OPTIMIZE, function () {
  	        // Let selection be restored by toolbar handlers before repositioning
  	        setTimeout(function () {
  	          if (_this3.root.classList.contains('ql-hidden')) return;
  	          var range = _this3.quill.getSelection();
  	          if (range != null) {
  	            _this3.position(_this3.quill.getBounds(range));
  	          }
  	        }, 1);
  	      });
  	    }
  	  }, {
  	    key: 'cancel',
  	    value: function cancel() {
  	      this.show();
  	    }
  	  }, {
  	    key: 'position',
  	    value: function position(reference) {
  	      var shift = _get(BubbleTooltip.prototype.__proto__ || Object.getPrototypeOf(BubbleTooltip.prototype), 'position', this).call(this, reference);
  	      var arrow = this.root.querySelector('.ql-tooltip-arrow');
  	      arrow.style.marginLeft = '';
  	      if (shift === 0) return shift;
  	      arrow.style.marginLeft = -1 * shift - arrow.offsetWidth / 2 + 'px';
  	    }
  	  }]);

  	  return BubbleTooltip;
  	}(_base.BaseTooltip);

  	BubbleTooltip.TEMPLATE = ['<span class="ql-tooltip-arrow"></span>', '<div class="ql-tooltip-editor">', '<input type="text" data-formula="e=mc^2" data-link="https://quilljs.com" data-video="Embed URL">', '<a class="ql-close"></a>', '</div>'].join('');

  	exports.BubbleTooltip = BubbleTooltip;
  	exports.default = BubbleTheme;

  	/***/ }),
  	/* 109 */
  	/***/ (function(module, exports, __webpack_require__) {

  	module.exports = __webpack_require__(63);


  	/***/ })
  	/******/ ])["default"];
  	}); 
  } (quill));

  var quillExports = quill.exports;
  var Quill = /*@__PURE__*/getDefaultExportFromCjs(quillExports);

  //textEditor  using Quill library
  //bind textarea to editor
  // export function TextEditor(Alpine) {
  //     Alpine.directive("texteditor",  (el) => {
  //       const target = el.hasAttribute('u-texteditor-target')?el.querySelector(el.getAttribute('u-texteditor-target')): el.querySelector('[u-texteditor-target]');
  //       const textarea = el.querySelector('[u-texteditor-textarea]')
  //       const textareaName = textarea.getAttribute('name')

  //       const placeholder = el.getAttribute('u-texteditor-placeholder');
  //       const value = el.getAttribute('u-texteditor-value')
  //       const toolbar = el.getAttribute('u-texteditor-toolbare')
  //       const type = el.getAttribute('u-texteditor-type')
  //       const model = el.getAttribute('u-texteditor-model')

  //       const types = {
  //         basic: undefined,
  //         simple: [
  //           [{ header: [1, 2, 3, 4, 5, 6, false] }],
  //           ["bold", "italic", "underline", "strike"],
  //           ["blockquote", "code-block"],
  //         ],
  //         standard: [
  //           [{ header: [1, 2, 3, 4, 5, 6, false] }],
  //           ["bold", "italic", "underline", "strike"],
  //           ["blockquote", "code-block"],
  //           [{ list: "ordered" }, { list: "bullet" }],
  //           [{ direction: "rtl" }],
  //           [{ size: ["small", false, "large", "huge"] }],
  //           [{ color: [] }, { background: [] }],
  //           [{ font: [] }],
  //           [{ align: [] }],
  //           ["clean"],
  //         ],
  //         advanced: [
  //           [{ header: [1, 2, 3, 4, 5, 6, false] }],
  //           ["bold", "italic", "underline", "strike"],
  //           ["blockquote", "code-block"],
  //           [{ list: "ordered" }, { list: "bullet" }],
  //           [{ script: "sub" }, { script: "super" }],
  //           [{ indent: "-1" }, { indent: "+1" }],
  //           [{ direction: "rtl" }],
  //           [{ size: ["small", false, "large", "huge"] }],
  //           [{ header: [1, 2, 3, 4, 5, 6, false] }],
  //           [{ color: [] }, { background: [] }],
  //           [{ font: [] }],
  //           [{ align: [] }],
  //           ["clean"],
  //         ],
  //       };

  //       let quill = new Quill(target, {
  //         modules: {
  //           toolbar: toolbar? toolbar: types[type],
  //         },
  //         theme: "snow",
  //         placeholder,
  //       });

  //       Alpine.bind(el, () => ({
  //         "u-init"() {
  //           console.log('model',model)
  //           console.log('model value',this[model])
  //           console.log('value',value)
  //           console.log('textarea name',textareaName)
  //           console.log('$data name',this[textareaName])

  //           quill.on("text-change", (delta, old, source) => {
  //             console.log('text-change fired')
  //             const innerHtml = quill.root.innerHTML
  //             textarea.value = innerHtml;
  //             //setting form $data
  //             if(this[textareaName]){
  //               console.log('old $data', this[textareaName])
  //               this[textareaName] = innerHtml ;
  //               console.log('new $data', this[textareaName])

  //             }
  //             //setting $model
  //             if(model){
  //               console.log('old model', this[model])
  //               this[model] = innerHtml;
  //               console.log('new model', this[model])
  //             }
  //           });
  //           // set initial text
  //           if(value){
  //             console.log('value set', value)
  //             quill.setText( value + '\n', 'api')
  //           }

  //         },
  //         "u-effect"(){
  //           //listening for $data changes
  //           if(this[textareaName] && (this[textareaName] !== quill.root.innerHTML)){
  //             console.log('$data property changed', this[textareaName])
  //             quill.root.innerHTML = this[textareaName]
  //             // quill.setText(this[textareaName]?? '')
  //           }
  //           //listening for $model changed
  //           if(model && (this[model] !== quill.root.innerHTML)){
  //             console.log('model changed', this[model], quill.root.innerHTML)
  //             quill.root.innerHTML = this[model]
  //             // quill.setText(this[model]?? '')
  //           }
  //         }
  //       }));
  //   });
  // }

  //bine editor to textarea
  function TextEditor(Alpine) {
    Alpine.directive("texteditor", (el) => {
      const target = el.hasAttribute("u-texteditor-target")
        ? el.querySelector(el.getAttribute("u-texteditor-target"))
        : el.querySelector("[u-texteditor-target]");
      const textarea = el.querySelector("[u-texteditor-textarea]");
      const textareaName = textarea.getAttribute("name");

      const placeholder = textarea.getAttribute("placeholder");
      const readOnly = el.hasAttribute("u-textarea-readonly");
      const disabled = textarea.hasAttribute("disabled");
      const value = textarea.getAttribute("value");
      const toolbar = el.getAttribute("u-texteditor-toolbare");
      const type = el.getAttribute("u-texteditor-type");
      const model = el.getAttribute("u-texteditor-model");

      const types = {
        basic: undefined,
        simple: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike"],
          ["blockquote", "code-block"],
        ],
        standard: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike"],
          ["blockquote", "code-block"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ direction: "rtl" }],
          [{ size: ["small", false, "large", "huge"] }],
          [{ color: [] }, { background: [] }],
          [{ font: [] }],
          [{ align: [] }],
          ["clean"],
        ],
        advanced: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike"],
          ["blockquote", "code-block"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ script: "sub" }, { script: "super" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ direction: "rtl" }],
          [{ size: ["small", false, "large", "huge"] }],
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ color: [] }, { background: [] }],
          [{ font: [] }],
          [{ align: [] }],
          ["clean"],
        ],
      };

      let quill = new Quill(target, {
        modules: {
          toolbar: toolbar ? toolbar : types[type],
        },
        theme: "snow",
        placeholder,
        readOnly: readOnly ?? disabled,
      });

      

      quill.on("text-change", (delta, old, source) => {
        console.log("text-change fired");
        const innerHtml = quill.root.innerHTML;
        innerHtml === "<p><br></p>"
          ? (textarea.value = "")
          : (textarea.value = innerHtml);
        textarea.dispatchEvent(new Event("input"));
      });
      
      if (value) quill.root.innerHTML = value;

      if (textarea.form) {
        textarea.form.addEventListener("reset", () => {
          textarea.value = "";
          textarea.dispatchEvent(new Event("input"));
        });
      }

      Alpine.bind(textarea, () => ({
        "u-model": model ? model : textareaName,
        "u-on:input"() {
          if (textarea.value !== quill.root.innerHTML || textarea.value === "") {
            quill.root.innerHTML = textarea.value;
          }
        },
      }));

      Alpine.bind(el, () => ({
        "u-effect"() {
          // listening for $data changes
          if (textareaName && this[textareaName] !== quill.root.innerHTML) {
            quill.root.innerHTML = textarea.value ? textarea.value : "";
          }
          //listening for $model changed
          if (model && this[model] !== quill.root.innerHTML) {
            quill.root.innerHTML = this[model] ? this[model] : "";
          }
        },
      }));
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
    TextEditor(Alpine);
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
