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

(defn syntax-highlight [langfile lines]
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

(defn move-to-end [key pages]
  (let [index-page (first (filter #(= key (:slug (:metadata %))) pages))
        without-index (vec (remove #(= key (:slug (:metadata %))) pages))]
    (conj without-index index-page)))

(defn move-to-start [key pages]
  (let [index-page (first (filter #(= key (:slug (:metadata %))) pages))
        without-index (vec (remove #(= key (:slug (:metadata %))) pages))]
    (cons index-page without-index)))

(defn generate-placeholder-file [base slug title dst]
  (spit 
    (format "%s/%s.html" dst slug)
    (utils/convert-to
      [:html
        [:head
          [:meta {:http-equiv "refresh" :content (format "0; URL=%s#%s" base slug)}]]
        [:body {:style "background-color:#040204;"} 
          [:h1 {:style "color:#040204;"} title]
          [:p {:style "color:#040204;"} title]]] :html)))

(defn template-page [content {:keys [base slug title dst] :or {slug ""}}]
  (let [slug (if (= slug "index") "" slug)]
    (when (not (empty? slug))
      (generate-placeholder-file base slug title dst)
      (spit (format "%s/sitemap.txt" dst) (format "%s/%s.html\n" base slug) :append true))
    [:article {:id slug :class (if (empty? slug) "homepage page" "page")}
      (markdown/markdown content :data)
      [:footer
        [:nav
          [:hr {:class "hidden"}]
          [:table {:width "100%"} [:tbody [:tr
            [:td {:width "50%" :align "left"}
              [:a {:href (str "#" slug)} "Back to top"]]
            [:td {:width "50%" :align "right"}
              [:a {:href "#" :class "hidden"} "Home"]]]]]
          [:hr {:class "hidden"}]]]]))

(defn template-site [{:keys [base]} content]
  (utils/convert-to
  [:html
    [:head
      [:meta {:name "viewport" :content "width=device-width, initial-scale=1.0"}]
      [:link {:rel "icon" :href "static/favicon.ico" :type "image/x-icon"}]
      [:link {:rel "stylesheet" :href "static/website.css"}]
      [:title "joshj.dev"]
      [:base {:href base}]
      [:link {:rel "preload" :href "static/AveriaLibre.woff2" :as "font" :type "font/woff2" :crossorigin true}]
      [:link {:rel "preload" :href "static/IosevkaSmall.woff2" :as "font" :type "font/woff2" :crossorigin true}]
      [:meta {:name "theme-color" :content "#040204"}]
      [:meta {:name "google-site-verification" :content "HzLecO0vaXdE95EUaURQI_yb5rqq-vj_3bv6PInHxvI"}]]
    [:body {:bgcolor "#c9e5ff"}
      [:input {:type "checkbox" :id "theme" :class "theme-checkbox" :hidden true}]
      [:main
        [:div
          [:section 
            [:header
              [:h1 [:a {:href "#"} "Josh's Website"]]
              [:nav
                [:hr {:class "hidden"}]
                [:table {:width "100%"} [:tbody [:tr
                  [:td {:width "25%" :align "left"}
                    [:a {:href "#"} "Home"]]
                  [:td {:width "25%" :align "center"}
                    [:a {:href "#blog"} "Blog"]]
                  [:td {:width "32%" :align "center"}
                    [:a {:href "http://github.com/joshjennings98" :target "_blank" :rel "noopener noreferrer"} "GitHub"]]
                  [:td {:width "18%" :align "right"}
                    [:label {:for "theme" :title "Toggle stars theme" :class "page-button"} "Theme"]]]]]
                [:hr {:class "hidden"}]]]
              content
          ]]]]] :html))

(let [[cfg-file] *command-line-args*]
  (when (or (empty? cfg-file))
    (println "\nUsage: generate.clj <path to config.edn>\n")
    (System/exit 1))
  (do
    (let [cfg (edn/read-string (slurp cfg-file))
          {src :src dst :dst langfile :langfile static :static base :base} cfg]
      (if-not (fs/exists? dst)
        (fs/create-dir dst))
      (let [sitemap (format "%s/sitemap.txt" dst)]
        (fs/delete-if-exists sitemap)
        (spit sitemap (format "%s\n" base)))
      (fs/copy-tree static (io/file dst "static") :replace-existing)
      (spit (format "%s/robots.txt" dst) (format "Sitemap: %s/sitemap.txt\n" base))
      (->> (list-md-files src)
           (map #(extract-content cfg %))
           (filter #(not (contains? (:metadata %) :skip)))
           (move-to-end "index")
           (move-to-start "blog")
           (map (fn [{:keys [md metadata]}] 
                    (template-page md metadata)))
           (reduce (fn [acc elem] (conj acc elem)) [:div])
           (template-site cfg)
           (syntax-highlight langfile)
           (#(str/replace (str/replace %1 "prex" "pre") #"\\n" "\n")) ; hack for pres in markdown files
           (#(str/replace %1 "<img" "<img loading='lazy'")) ; lazy load images
           (spit (format "%s/index.html" dst))))))
