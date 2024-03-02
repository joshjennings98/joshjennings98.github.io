#!/usr/bin/env bb

(require '[babashka.pods :as pods])
(require '[babashka.fs :as fs])
(require '[clojure.string :as str])
(require '[clojure.java.io :as io])
(require '[clojure.edn :as edn])

(pods/load-pod 'retrogradeorbit/bootleg "0.1.9")

(require '[pod.retrogradeorbit.bootleg.utils :as utils])
(require '[pod.retrogradeorbit.bootleg.markdown :as markdown])

(defn tokenise-pre-content [hl-mapping input]
  (let [unescape-html (fn [html]
                        (let [replacements {"&lt;" "<" "&gt;" ">" "&amp;" "&" "&quot;" "\"" "&#039;" "'"}]
                          (reduce (fn [acc [k v]] 
                                    (str/replace acc k v)) 
                                  html 
                                  replacements)))
        replace-match-with-token (fn [token match]
                                   (str/join (repeat (count match) token)))
        set-unchanged-char (fn [orig-char final-char]
                             (if (= orig-char final-char) 
                               "0" 
                               final-char))
        input-lower (str/lower-case (unescape-html input))
        tokenised (reduce (fn [acc mapping]
                            (let [token (first (keys (:token mapping)))]
                              (str/replace acc (re-pattern (:regex mapping)) (partial replace-match-with-token token))))
                          input-lower 
                          hl-mapping)]
    (map set-unchanged-char input-lower tokenised)))

(defn create-hl-gradient [hl-mapping tokens]
  (let [colour-map (into {} (map #(:token %1) hl-mapping))
        grouped-tokens (partition-by second (map-indexed vector tokens))
        gradient-parts (map (fn [group]
                              (let [first-index (first (first group))
                                    colour (get colour-map (str (second (first group))) "white")
                                    length (count group)]
                                [colour first-index length])) 
                            grouped-tokens)
        create-colour-block (fn [acc [colour index length]] 
                              (format "%s, %s %sch, %s %sch" acc colour index colour (+ index length)))]
    (format "background: linear-gradient(to right %s); -webkit-background-clip: text" (reduce create-colour-block "" gradient-parts))))

(defn syntax-highlight [lines langfile]
  (let [regex #"(?s)<pre><code class=\"([^\"]*)\">(.*?)</code></pre>"
        hl-mappings (edn/read-string {:readers {'regex #(re-pattern %1)}} (slurp langfile)) 
        replace-func (fn [lang content]
                       (let [hl-mapping (get hl-mappings lang)]
                         (->> content 
                              (tokenise-pre-content hl-mapping) 
                              (create-hl-gradient hl-mapping))))
        process-match (fn [lang code]
                        (let [spans (map #(format "<span style=\"%s\">%s</span>" (replace-func lang %) %) (str/split code #"\n"))]
                          (str/join "\n" spans)))]
    (reduce (fn [acc match]
              (let [[_ lang code] match]
                (str/replace-first acc (first match) (format "<pre class=\"%s\"><code>%s</code></pre>" lang (process-match lang code)))))
            lines
            (re-seq regex lines))))

(defn list-md-files [dir]
  (let [content-file? (fn [file] 
                        (and (.isFile file) (re-find #".*\.md$" (.getName file))))]
    (filter content-file? 
            (file-seq (io/file dir)))))

(defn extract-content [cfg file]
  (let [parse-metadata (fn [raw-metadata cfg]
                         (->> (try
                                (str/split raw-metadata #"\n")
                                (catch Exception e (println (format "Could not extract metadata from '%s'" (.getName file)))))
                              (remove str/blank?) 
                              (map (fn [line]
                                      (let [[key val] (map str/trim (str/split line #"\s*:\s*" 2))]
                                        [(keyword key) val])))
                              (into cfg)))
        [_ raw-metadata md] (str/split (slurp file) #"---+" 3)
        metadata (parse-metadata raw-metadata cfg)]
    {:md md :metadata metadata}))

(defn add-hx-attributes [html-content]
  (str/replace html-content #"<a([^>]+href=\"[^\"]*\")([^>]*)>" "<a$1$2 hx-boost=\"true\" hx-push-url=\"true\">"))

(defn template-page [content {:keys [slug title base] :or {slug ""}}]
  [:html
    [:head
      [:meta {:name "viewport" :content "width=device-width, initial-scale=1.0"}]
      [:link {:rel "icon" :href "static/favicon.ico" :type "image/x-icon"}]
      [:link {:rel "stylesheet" :href "static/website.css"}]
      [:script {:src "static/htmx.min.js"}]
      [:title (str "joshj.dev - " title)]
      [:base {:href base}]]
    [:body
      [:main {:class "container"}
        [:div {:class "inner-container"} 
          [:header
            [:h1 [:a {:href "index.html"} "Josh's Website"]]
            [:ul {:class "nav"}
              [:li [:a {:href "index.html"} "Home"]]
              [:li [:a {:href "projects.html"} "Projects"]]
              [:li [:a {:href "blog.html"} "Blog"]]
              [:li [:a {:href "misc.html"} "Misc"]]]]        
          [:article {:id slug}
            (markdown/markdown content :data)
          [:footer
            [:ul {:class "nav"}
              [:li [:a {:href (str slug ".html")} "Back to top"]]
              [:li [:a {:href "index.html"} "Home"]]]]]]]]])

(let [[cfg-file] *command-line-args*]
  (when (or (empty? cfg-file))
    (println "\nUsage: generate.clj <path to config.edn>\n")
    (System/exit 1))
  (do
    (let [cfg (edn/read-string (slurp cfg-file))
          {src :src dst :dst langfile :langfile static :static} cfg]
      (fs/create-dir dst)
      (fs/copy-tree static (io/file dst "static") :replace-existing)
      (->> (list-md-files src)
           (map #(extract-content cfg %))
           (map (fn [{:keys [md metadata]}] 
                  (let [slug (:slug metadata)
                        content (-> md 
                                    (template-page metadata)
                                    (utils/convert-to :html)
                                    (syntax-highlight langfile)
                                    (add-hx-attributes))]
                    {:content content :slug slug})))
           (#(doseq [{:keys [content slug]} %]
               (spit (str dst slug ".html") content)))))))

