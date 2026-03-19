# 📄 Milestone 1 – Data Visualization Project

---

## Dataset

This project focuses on analyzing perfume composition and popularity using the [Fragrantica Fragrance Dataset](https://www.kaggle.com/datasets/olgagmiufana1/fragrantica-com-fragrance-dataset) as the primary dataset. It contains around 20,000 perfumes and includes detailed information such as fragrance notes (top, middle, base), accords, gender category, and user ratings. With 18 structured columns, this dataset provides a rich representation of olfactory composition, making it particularly suitable for analyzing relationships between scent structure and perceived attractiveness.

To incorporate economic and market-related aspects, we use the [Perfume E-commerce Dataset 2024](https://www.kaggle.com/datasets/kanchana1990/perfume-e-commerce-dataset-2024), which contains around 2,000 perfumes listed on eBay. This dataset includes pricing and product listing information, allowing us to extend the analysis to market positioning. However, since the data originates from eBay, it primarily reflects markets where eBay is widely used, particularly the United States. Therefore, price-related insights should be interpreted within this geographic context.

The overall data quality is good, as both datasets are structured and publicly available. However, preprocessing is required. Fragrance notes are stored as text and must be parsed into structured formats. Similar notes need to be grouped into broader categories (e.g., citrus, woody, floral), inconsistencies in naming must be resolved, and missing values (especially in ratings or prices) will be handled. Overall, preprocessing remains moderate and consistent with the course requirements.

---

## Problematic

This project aims to answer the following question: *what makes a perfume attractive, and how does its composition influence its popularity and market value?* More specifically, we investigate whether certain fragrance notes or combinations of notes are systematically associated with higher user ratings and higher prices.

The main objective is to identify patterns in olfactory composition that explain why some perfumes are more appreciated than others. In particular, we compare perfumes marketed toward men and women to determine whether preferences in scent composition differ. In addition, we analyze how perfume composition evolves over time using release year data, allowing us to identify trends in olfactory preferences.

The available data does not allow for direct seasonal analysis (e.g., summer vs winter). Instead, temporal analysis at the level of release year provides a more reliable proxy for studying trends.

The goal is to produce clear and intuitive visualization on perfume data including preferences depending gender, year and tone.

---

## Exploratory Data Analysis

TODO

Missing value, stats on most seen tones( for male and for female), stats tone vs ratings

---

## Related Work

Platforms such as [Parfumo Discover](https://www.parfumo.com/Discover) provide interactive tools to explore perfumes based on notes, popularity, and categories, illustrating existing approaches to fragrance data visualization.

Some projects have applied machine learning techniques, such as the [Perfume Recommender System](https://github.com/kessiezhang/Perfume_Recommender_System), which focuses on suggesting fragrances based on similarity rather than interpreting composition.

Other works, such as Scento’s global fragrance map (https://www.scento.com/blog/global-fragrance-map-regional-styles), highlight geographic differences in scent preferences, showing that cultural factors influence fragrance composition. //add scentMap.png

Our approach differs by focusing on interpretable relationships between composition, user ratings, and price. By combining compositional and market data, we aim to uncover patterns in perfume attractiveness, including differences across gender and temporal trends.