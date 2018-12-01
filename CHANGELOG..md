## 2.0.0

### Feature
* **Add `[videoId]`**: add videoId to set player video with `string` or `string[]`, and can change video with this `[input]`;
* **Implement all youtube api options**: Now when children elements length is equal zero, stop drag event.
* **Optimizate with event**: Bind youtube api event only when element output event has actual binding with method.

### Break Change
* **NgxY2PlayerOptions**: remove videoId, using `[input]` `[vidoeId]`.


## 1.4.1

* **Change peerDependencies to more than 6.0.0:** Change peerDependencies to more than 6.0.0

## 1.4.0

### Refactory Project
* refactory code with rxjs and more maintainable

## 1.3.0

### Change Resize detect with [resize-observer-polyfill](https://github.com/que-etc/resize-observer-polyfill)
* Change Resize detect with [resize-observer-polyfill]
* Fix Resize problem with window.
* Add Example with custom player.

## 1.2.0

### Change package tool to NgPackgr
* Using ng g lib to generate lib
* Upgrade to Angular 6+ and Rxjs6+

## 1.1.0

### Auto resize with container

* Make player can resize with conatiner


## 1.0.0

### First Release

* An youtube player for Angular with YT API
