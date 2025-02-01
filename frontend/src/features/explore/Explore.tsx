import React, { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { useDebounce } from "use-debounce";

import {
  Card,
  CardTypePrefixes,
  ExploreDebounceMS,
  ExplorePageSize,
  RibbonHeight,
} from "@/common/constants";
import { StyledDropdownTreeSelect } from "@/common/StyledDropdownTreeSelect";
import {
  CardType,
  FilterSettings,
  SearchSettings,
  SearchTypeSettings,
  SourceSettings,
  useAppSelector,
} from "@/common/types";
import { BlurrableRow } from "@/components/BlurrableRow";
import { NoBackendDefault } from "@/components/NoBackendDefault";
import { OverflowCol } from "@/components/OverflowCol";
import { Ribbon } from "@/components/Ribbon";
import { Spinner } from "@/components/Spinner";
import { DatedCard } from "@/features/card/Card";
import { FilterSettings as FilterSettingsElement } from "@/features/searchSettings/FilterSettings";
import { SearchTypeSettings as SearchTypeSettingsElement } from "@/features/searchSettings/SearchTypeSettings";
import { SourceSettings as SourceSettingsElement } from "@/features/searchSettings/SourceSettings";
import { useGetSampleCardsQuery, usePostExploreSearchQuery } from "@/store/api";
import { useBackendConfigured } from "@/store/slices/backendSlice";
import {
  getDefaultSearchSettings,
  getDefaultSourceSettings,
} from "@/store/slices/SearchSettingsSlice";
import { selectSourceDocuments } from "@/store/slices/sourceDocumentsSlice";

export function Explore() {
  const maybeSourceDocuments = useAppSelector(selectSourceDocuments);
  const backendConfigured = useBackendConfigured();

  const defaultSettings: SearchSettings = getDefaultSearchSettings(
    maybeSourceDocuments ?? []
  );

  // pagination state
  const [pageStart, setPageStart] = useState<number>(0);

  // input state
  const [query, setQuery] = useState<string>("");
  const [cardTypes, setCardTypes] = useState<Array<CardType>>([]);
  const [searchTypeSettings, setSearchTypeSettings] =
    useState<SearchTypeSettings>(defaultSettings.searchTypeSettings);

  const [filterSettings, setFilterSettings] = useState<FilterSettings>(
    defaultSettings.filterSettings
  );

  const [sourceSettings, setSourceSettings] = useState<SourceSettings>(
    defaultSettings.sourceSettings
  );

  // ensure pagination is reset when any filters change
  function updateInputAndResetPageStart<T>(setter: { (value: T): void }) {
    return (value: T): void => {
      setPageStart(0);
      setter(value);
    };
  }
  const setQueryAndResetPageStart = updateInputAndResetPageStart(setQuery);
  const setCardTypesAndResetPageStart =
    updateInputAndResetPageStart(setCardTypes);
  const setLocalSearchTypeSettingsAndResetPageStart =
    updateInputAndResetPageStart(setSearchTypeSettings);
  const setLocalFilterSettingsAndResetPageStart =
    updateInputAndResetPageStart(setFilterSettings);
  const setLocalSourceSettingsAndResetPageStart =
    updateInputAndResetPageStart(setSourceSettings);

  // TODO: review this later. check redux object refs are stable so this triggers predictably.
  useEffect(() => {
    // handle race condition - reconfigure source settings when source documents are accessible.
    if (maybeSourceDocuments !== undefined) {
      setSourceSettings(getDefaultSourceSettings(maybeSourceDocuments));
    }
  }, [maybeSourceDocuments]);

  const getSampleCardsQuery = useGetSampleCardsQuery();
  const placeholderCardName =
    getSampleCardsQuery.data != null &&
    (getSampleCardsQuery.data ?? {})[Card][0] != null
      ? getSampleCardsQuery.data[Card][0].name
      : "";

  const exploreSearch = {
    searchSettings: {
      searchTypeSettings: searchTypeSettings,
      filterSettings: filterSettings,
      sourceSettings: sourceSettings,
    },
    query: query,
    cardTypes: cardTypes,
    pageStart: pageStart,
    pageSize: ExplorePageSize,
  };
  // debounced filters to avoid spamming webserver
  function equalityFn<T>(left: T, right: T): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  }
  const [debouncedExploreSearch, debouncedExploreSearchState] = useDebounce(
    exploreSearch,
    ExploreDebounceMS,
    { equalityFn }
  );

  const postExploreSearchQuery = usePostExploreSearchQuery(
    debouncedExploreSearch
  );

  // pagination stuff
  const resultCount = postExploreSearchQuery.data?.count ?? 0;
  const currentPageSize = postExploreSearchQuery.data?.cards?.length ?? 0;
  const multiplePagesExist = resultCount !== currentPageSize;
  const previousPageExists = multiplePagesExist && pageStart > 0;
  const nextPageExists =
    multiplePagesExist && pageStart + ExplorePageSize < resultCount;

  const displaySpinner =
    debouncedExploreSearchState.isPending() ||
    postExploreSearchQuery.isFetching;

  return backendConfigured ? (
    <>
      <Row className="g-0">
        <OverflowCol
          lg={4}
          md={4}
          sm={6}
          xs={6}
          style={{ zIndex: 1 }}
          className="px-2"
        >
          <h5>Search Query</h5>
          <Form.Control
            onChange={(event) =>
              setQueryAndResetPageStart(event.target.value.trim())
            }
            aria-describedby="searchQueryText"
            placeholder={placeholderCardName}
          />
          <Form.Label htmlFor="selectTags">
            Select tags which card types to include
          </Form.Label>
          <StyledDropdownTreeSelect
            data={Object.values(CardTypePrefixes).map((cardType) => ({
              label:
                cardType[0].toUpperCase() + cardType.slice(1).toLowerCase(),
              value: cardType,
              checked: cardTypes.includes(cardType),
            }))}
            onChange={(currentNode, selectedNodes) =>
              setCardTypesAndResetPageStart(
                selectedNodes.map((item) => item.value as CardType)
              )
            }
          />
          <hr />
          <SearchTypeSettingsElement
            searchTypeSettings={searchTypeSettings}
            setSearchTypeSettings={setLocalSearchTypeSettingsAndResetPageStart}
            enableFiltersApplyToCardbacks={false}
          />
          <hr />
          <FilterSettingsElement
            filterSettings={filterSettings}
            setFilterSettings={setLocalFilterSettingsAndResetPageStart}
          />
          <hr />
          <SourceSettingsElement
            sourceSettings={sourceSettings}
            setSourceSettings={setLocalSourceSettingsAndResetPageStart}
            enableReorderingSources={false}
          />
        </OverflowCol>

        <Col style={{ position: "relative" }} lg={8} md={8} sm={6} xs={6}>
          {displaySpinner && (
            <Spinner size={6} zIndex={3} positionAbsolute={true} />
          )}
          <OverflowCol
            disabled={displaySpinner}
            scrollable={!displaySpinner}
            heightDelta={RibbonHeight}
          >
            <BlurrableRow
              xxl={4}
              lg={3}
              md={2}
              sm={1}
              xs={1}
              className="g-0"
              disabled={displaySpinner}
            >
              {postExploreSearchQuery.data?.cards?.map((card) => (
                <DatedCard
                  cardDocument={card}
                  key={`explore-card-${card.identifier}`}
                />
              ))}
            </BlurrableRow>
          </OverflowCol>
          <Ribbon className="mx-0" position="bottom">
            <div className="text-center align-content-center position-relative">
              <Button
                variant="outline-info"
                className="position-absolute top-50 start-0 translate-middle-y ms-1"
                disabled={!previousPageExists}
                onClick={() =>
                  setPageStart((value) => Math.max(value - ExplorePageSize, 0))
                }
              >
                &#10094;
              </Button>
              {!displaySpinner && (
                <span>
                  {multiplePagesExist && (
                    <>
                      <b>{(pageStart + 1).toLocaleString()}</b> —
                      <b>{(pageStart + currentPageSize).toLocaleString()}</b> of{" "}
                    </>
                  )}
                  <b>{resultCount.toLocaleString()}</b> result
                  {resultCount !== 1 ? "s" : ""}
                </span>
              )}
              <Button
                variant="outline-info"
                className="position-absolute top-50 end-0 translate-middle-y"
                disabled={!nextPageExists}
                onClick={() =>
                  setPageStart((value) =>
                    Math.min(value + ExplorePageSize, resultCount)
                  )
                }
              >
                &#10095;
              </Button>
            </div>
          </Ribbon>
        </Col>
      </Row>
    </>
  ) : (
    <NoBackendDefault />
  );
}
