"use strict";
define(["bacon", "jquery", "jquery.cookie", "bacon.model", "bacon.jquery"], function(Bacon, $) {
  var author = Bacon.Model($.cookie("author"))
  author.onValue(function(author) {
    $.cookie("author", author, { expires: 365 })
  })
  var saveBus = new Bacon.Bus()
  var saveResult = saveBus.map(function(data) {
    return {
      url: "/turtle",
      type: "post",
      contentType: "application/json",
      data: JSON.stringify(data)
    }
  }).ajax()
  var savePending = saveBus.awaiting(saveResult)

  var openBus = new Bacon.Bus()
  var openResult = openBus.ajax()

  function withAuthor(f) {
    return author.take(1).flatMap(f)
  }

  return {
    author: author,
    saveBus: saveBus,
    saveResult: saveResult,
    savePending: savePending,
    save: function(name, code, turtle) {
      return withAuthor(function(author) {
        var saveData = {
          author: author,
          description: name,
          code: code,
          //commands: turtle.export()
          preview: turtle.exportImage()
        }      
        saveBus.push(saveData)
        return saveResult.take(1).map("saved").endOnError()
      })
    },
    open: function(name) { 
      openBus.push("/turtle/" + name) 
      return openResult.take(1).errors().endOnError()
    },
    openResult: openResult,
    ls: function() {
      return withAuthor(function(author) {
        return Bacon.fromPromise($.ajax({url: "/turtles/" + author}))
          .map(function(turtles) {
            var names = _.sortBy(_.uniq(turtles.map(function(t) { return t.content.description })), _.identity)
            return names
          })
      })
    }
  }
})
