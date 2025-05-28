import pandas as pd
import re
from sklearn.base import BaseEstimator, TransformerMixin


class ImportDataTransformer(BaseEstimator, TransformerMixin):
    def __init__(self, file_path=None):
        self.file_path = file_path
        self.file_readers = {
            ".csv": pd.read_csv,
            ".xlsx": pd.read_excel,
            ".parquet": pd.read_parquet,
            
        }

    def fit(self, X=None, y=None):
        return self

    def transform(self, X=None):
        if not self.file_path:
            print("No file path provided, returning empty DataFrame.")
            return pd.DataFrame()

        file_extension = self.file_path.split(".")[-1]
        read_function = self.file_readers.get(f".{file_extension}")

        if not read_function:
            raise ValueError(
                "Unsupported file format! Please use CSV, XLSX, or Parquet."
            )

        data = read_function(self.file_path)
        print(f"Data imported from {self.file_path}")
        return data


class MandatoryColumnsChecker(BaseEstimator, TransformerMixin):
    def __init__(self, mandatory_columns=None):
        self.mandatory_columns = mandatory_columns if mandatory_columns else []
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        missing_columns = [
            col for col in self.mandatory_columns if col not in X.columns
        ]
        self.errors = (
            pd.DataFrame({"Missing Columns": missing_columns})
            if missing_columns
            else pd.DataFrame()
        )
        return X


class ColumnNameCleaner(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        X.columns = X.columns.str.strip().str.lower().str.replace(" ", "_", regex=True)
        return X


class WhitespaceCaseCleaner(BaseEstimator, TransformerMixin):
    def __init__(self, columns=None, case="lower"):
        self.columns = columns if columns else []
        self.case = case
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        for col in self.columns:
            if col in X.columns:
                X[col] = X[col].astype(str).str.strip()
                X[col] = (
                    X[col].str.lower() if self.case == "lower" else X[col].str.upper()
                )
        return X


class MissingValuesDetector(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        missing_values = X[X.isnull().any(axis=1)]
        self.errors = missing_values if not missing_values.empty else pd.DataFrame()
        return X


class IDValidator(BaseEstimator, TransformerMixin):
    def __init__(self, id_column=None):
        self.id_column = id_column
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if self.id_column and self.id_column in X.columns:
            invalid_ids = X[X[self.id_column].isnull()]
            self.errors = invalid_ids if not invalid_ids.empty else pd.DataFrame()
        return X


class NumericConverter(BaseEstimator, TransformerMixin):
    def __init__(self, columns=None):
        self.columns = columns if columns else []
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        for col in self.columns:
            if col in X.columns:
                X[col] = pd.to_numeric(X[col], errors="coerce")
        conversion_issues = (
            X[X[self.columns].isnull().any(axis=1)] if self.columns else pd.DataFrame()
        )
        self.errors = (
            conversion_issues if not conversion_issues.empty else pd.DataFrame()
        )
        return X


class NegativeZeroChecker(BaseEstimator, TransformerMixin):
    def __init__(self, columns=None):
        self.columns = columns if columns else []
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        negative_zero_issues = (
            X[X[self.columns].le(0).any(axis=1)] if self.columns else pd.DataFrame()
        )
        self.errors = (
            negative_zero_issues if not negative_zero_issues.empty else pd.DataFrame()
        )
        return X


class DuplicatesFromtheData(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
      
        duplicates = X[X.duplicated()]

        if not duplicates.empty:
            duplicates = duplicates.sort_index()

        self.errors = duplicates
        return X



class DuplicateIdentifier(BaseEstimator, TransformerMixin):
    def __init__(self, columns=None):
        self.columns = columns
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        duplicates = (
            X[X.duplicated(subset=self.columns)] if self.columns else X[X.duplicated()]
        )
        self.errors = duplicates if not duplicates.empty else pd.DataFrame()
        return X


class DateConverter(BaseEstimator, TransformerMixin):
    def __init__(self, columns=None):
        self.columns = columns if columns else []
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        for col in self.columns:
            if col in X.columns:
                X[col] = pd.to_datetime(X[col], errors="coerce")
        date_conversion_issues = (
            X[X[self.columns].isnull().any(axis=1)] if self.columns else pd.DataFrame()
        )
        self.errors = (
            date_conversion_issues
            if not date_conversion_issues.empty
            else pd.DataFrame()
        )
        return X


class StartEndYearComparator(BaseEstimator, TransformerMixin):
    def __init__(self, start_year_column=None, end_year_column=None):
        self.start_year_column = start_year_column
        self.end_year_column = end_year_column
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if (
            self.start_year_column
            and self.end_year_column
            and self.start_year_column in X.columns
            and self.end_year_column in X.columns
        ):
            start_end_issues = X[X[self.start_year_column] > X[self.end_year_column]]
            self.errors = (
                start_end_issues if not start_end_issues.empty else pd.DataFrame()
            )
        return X


class YearFilter(BaseEstimator, TransformerMixin):
    def __init__(self, date_column=None, start_year=None, end_year=None):
        self.date_column = date_column
        self.start_year = start_year
        self.end_year = end_year
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if self.date_column and self.date_column in X.columns:
            X = X.copy()
            X["year"] = pd.to_datetime(X[self.date_column], errors="coerce").dt.year
            year_issues = X[(X["year"] < self.start_year) | (X["year"] > self.end_year)]
            X.drop(columns=["year"], inplace=True)
            self.errors = year_issues if not year_issues.empty else pd.DataFrame()
        return X


class RemoveUnwantedCharacters(BaseEstimator, TransformerMixin):
    def __init__(self, columns=None, characters_to_remove=None):
        self.columns = columns
        self.characters_to_remove = characters_to_remove
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if not self.characters_to_remove:
            raise ValueError("characters_to_remove must be specified.")

        X = X.copy()
        pattern = f"[{re.escape(self.characters_to_remove)}]"

        for col in (self.columns if self.columns else X.columns):
            if col in X.columns:
                mask = X[col].astype(str).str.contains(pattern, regex=True, na=False)
                problematic_rows = X.loc[mask, col]
                if not problematic_rows.empty:
                    error_data = pd.DataFrame({
                        "column": [col] * len(problematic_rows),
                        "row": problematic_rows.index,
                        "value": problematic_rows.values,
                        "issue_type": ["Unwanted characters found"] * len(problematic_rows),
                    })
                    self.errors = pd.concat([self.errors, error_data], ignore_index=True)
                X[col] = X[col].astype(str).str.replace(pattern, "", regex=True)

        return X


class UniqueIDGenerator(BaseEstimator, TransformerMixin):
    def __init__(self, id_column="unique_id", columns_to_concat=None):
        self.id_column = id_column
        self.columns_to_concat = columns_to_concat if columns_to_concat else []
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if self.columns_to_concat:
            X[self.id_column] = (
                X[self.columns_to_concat].astype(str).agg("-".join, axis=1)
            )
        else:
            X[self.id_column] = pd.util.hash_pandas_object(X).astype(str)
        return X


class ColumnFilter(BaseEstimator, TransformerMixin):
    def __init__(self, columns_to_keep=None):
        self.columns_to_keep = columns_to_keep if columns_to_keep else []
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        return X[self.columns_to_keep].copy() if self.columns_to_keep else X.copy()


class FinalSaver(BaseEstimator, TransformerMixin):
    def __init__(self, cleaned_filename="cleaned_data.xlsx"):
        self.cleaned_filename = cleaned_filename
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X.to_excel(self.cleaned_filename, index=False)
        print(f"Cleaned data saved to {self.cleaned_filename}")
        return X


class IssueSaver(BaseEstimator, TransformerMixin):
    def __init__(self, filename="data_issues.xlsx"):
        self.filename = filename
        self.pipeline_steps = []

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        errors = {}
        if self.pipeline_steps:
            for name, transformer in self.pipeline_steps:
                if (
                    hasattr(transformer, "errors")
                    and isinstance(transformer.errors, pd.DataFrame)
                    and not transformer.errors.empty
                ):
                    errors[name] = transformer.errors

        with pd.ExcelWriter(self.filename) as writer:
            for name, df in errors.items():
                sheet_name = name[:31]
                df.to_excel(writer, sheet_name=sheet_name, index=False)
            print(f"Issues saved to {self.filename}")

        return X
