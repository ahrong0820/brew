# Coffee recommendation data foundation

## Purpose

This layer prepares bean-based recommendation features without changing the existing recipe timer UI.

The current `coffee-custom-recipes` localStorage key remains untouched. New data uses separate versioned keys so existing custom recipes and favorites are not overwritten.

## Storage keys

- `brew.beans.v1`
- `brew.grinderProfiles.v1`
- `brew.beanBrewProfiles.v1`
- `brew.brewSessions.v1`
- `brew.userPreferences.v1`

Collections are stored in this envelope:

```json
{
  "version": 1,
  "updatedAt": "ISO-8601 timestamp",
  "items": []
}
```

User preferences use the same structure with a `value` field instead of `items`.

## Domain hierarchy

```text
Bean
  -> BeanBrewProfile (brewer + grinder + taste goal)
      -> BrewSession snapshots
```

- A bean is the user-facing top-level unit.
- A profile separates different brewers, grinders, and taste goals for the same bean.
- Every brew session keeps a full recipe snapshot so later edits do not rewrite history.

## Built-in grinder profiles

### 1Zpresso K-Ultra

- Primary grinder for the first recommendation implementation.
- Uses the user's `burr-no-rub` zero point.
- Higher dial values are coarser.
- It is not automatically converted from the factory zero reference.

### Holzklotz E80

- Stored as an unverified reference profile.
- Dial direction and conversion data remain `unknown` until verified.
- The first UI must label its recommendations as reference values.

### Baratza Encore

- Refers to the standard Encore, not Encore ESP.
- Uses integer click display.
- Initial recommendations must be shown as a range until mapping data is verified.

## Default user preferences

- Brewer: V60
- Dose: 15 g
- Water: 240 g
- Drink style: hot
- Grinder: K-Ultra with burr-no-rub zero
- Taste goal: balanced

## Next implementation step

Build bean CRUD UI on top of `beanStore` and initialize the default grinder profiles through `initializeCoffeeStorage()` from a client component.
