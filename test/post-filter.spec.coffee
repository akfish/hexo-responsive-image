describe "Post Filters", ->
  describe "before_post_render", ->
    it "should extract images"
    it "should extract images in front-matter field as configured"
    it "should resolve image path"
  describe "after_post_render", ->
    it "should insert responsive image sources in post data"
    it "should provide xxx_responsive field for configured front-matter fields"
    it "should replace <img> tags with responsive <picture> in renderer HTML"
