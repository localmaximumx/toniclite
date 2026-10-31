declare global {
  interface Window {
    loadPyodide: (config?: any) => Promise<any>;
    pyodideInstance?: any;
  }
}

let pyodideLoadingPromise: Promise<any> | null = null;

const PYTHON_PREAMBLE = `
import sys
import types
import json
import numpy as np

# Setup PyTorch & Triton compatibility layer in sys.modules
if 'torch' not in sys.modules:
    torch = types.ModuleType('torch')
    nn = types.ModuleType('torch.nn')
    F = types.ModuleType('torch.nn.functional')

    class Tensor:
        def __init__(self, data, dtype=None):
            if isinstance(data, Tensor):
                self._arr = np.array(data._arr, dtype=dtype or data._arr.dtype)
            elif isinstance(data, np.ndarray):
                self._arr = np.array(data, dtype=dtype or data.dtype)
            else:
                arr = np.array(data)
                if dtype is not None:
                    self._arr = arr.astype(dtype)
                elif np.issubdtype(arr.dtype, np.floating):
                    self._arr = arr.astype(np.float32)
                elif np.issubdtype(arr.dtype, np.integer):
                    self._arr = arr.astype(np.int64)
                else:
                    self._arr = arr

        @property
        def shape(self):
            return self._arr.shape

        @property
        def ndim(self):
            return self._arr.ndim

        @property
        def dtype(self):
            return self._arr.dtype

        @property
        def device(self):
            return 'cpu'

        def dim(self):
            return self._arr.ndim

        def size(self, dim=None):
            if dim is None:
                return self._arr.shape
            return self._arr.shape[dim]

        def numel(self):
            return self._arr.size

        def clone(self):
            return Tensor(self._arr.copy())

        def detach(self):
            return self

        def cpu(self):
            return self

        def cuda(self, device=None):
            return self

        def numpy(self):
            return self._arr

        def tolist(self):
            return self._arr.tolist()

        def item(self):
            return self._arr.item()

        def to(self, *args, **kwargs):
            for a in args:
                if isinstance(a, (type, np.dtype)) or hasattr(a, 'name'):
                    try:
                        return Tensor(self._arr.astype(a))
                    except Exception:
                        pass
            return self

        def float(self):
            return Tensor(self._arr.astype(np.float32))

        def double(self):
            return Tensor(self._arr.astype(np.float64))

        def long(self):
            return Tensor(self._arr.astype(np.int64))

        def int(self):
            return Tensor(self._arr.astype(np.int32))

        def bool(self):
            return Tensor(self._arr.astype(bool))

        def contiguous(self):
            return self

        def reshape(self, *shape):
            if len(shape) == 1 and isinstance(shape[0], (tuple, list)):
                shape = shape[0]
            return Tensor(self._arr.reshape(shape))

        def view(self, *shape):
            return self.reshape(*shape)

        def transpose(self, dim0, dim1):
            axes = list(range(self._arr.ndim))
            axes[dim0], axes[dim1] = axes[dim1], axes[dim0]
            return Tensor(np.transpose(self._arr, axes))

        def permute(self, *dims):
            if len(dims) == 1 and isinstance(dims[0], (tuple, list)):
                dims = dims[0]
            return Tensor(np.transpose(self._arr, dims))

        def squeeze(self, dim=None):
            return Tensor(np.squeeze(self._arr, axis=dim))

        def unsqueeze(self, dim):
            return Tensor(np.expand_dims(self._arr, axis=dim))

        def flatten(self, start_dim=0, end_dim=-1):
            if end_dim == -1:
                end_dim = self._arr.ndim - 1
            shape = list(self._arr.shape[:start_dim]) + [-1] + list(self._arr.shape[end_dim+1:])
            return Tensor(self._arr.reshape(shape))

        @property
        def T(self):
            if self._arr.ndim >= 2:
                return Tensor(np.swapaxes(self._arr, -1, -2))
            return Tensor(self._arr.T)

        def sum(self, dim=None, keepdim=False):
            return Tensor(np.sum(self._arr, axis=dim, keepdims=keepdim))

        def mean(self, dim=None, keepdim=False):
            return Tensor(np.mean(self._arr, axis=dim, keepdims=keepdim))

        def max(self, dim=None, keepdim=False):
            if dim is None:
                return Tensor(np.max(self._arr))
            return Tensor(np.max(self._arr, axis=dim, keepdims=keepdim))

        def min(self, dim=None, keepdim=False):
            if dim is None:
                return Tensor(np.min(self._arr))
            return Tensor(np.min(self._arr, axis=dim, keepdims=keepdim))

        def argmax(self, dim=None, keepdim=False):
            return Tensor(np.argmax(self._arr, axis=dim, keepdims=keepdim))

        def argmin(self, dim=None, keepdim=False):
            return Tensor(np.argmin(self._arr, axis=dim, keepdims=keepdim))

        def std(self, dim=None, keepdim=False, unbiased=True):
            ddof = 1 if unbiased else 0
            return Tensor(np.std(self._arr, axis=dim, keepdims=keepdim, ddof=ddof))

        def var(self, dim=None, keepdim=False, unbiased=True):
            ddof = 1 if unbiased else 0
            return Tensor(np.var(self._arr, axis=dim, keepdims=keepdim, ddof=ddof))

        def norm(self, p=2, dim=None, keepdim=False):
            return Tensor(np.linalg.norm(self._arr, ord=p, axis=dim, keepdims=keepdim))

        def abs(self):
            return Tensor(np.abs(self._arr))

        def sqrt(self):
            return Tensor(np.sqrt(self._arr))

        def exp(self):
            return Tensor(np.exp(self._arr))

        def log(self):
            return Tensor(np.log(self._arr))

        def sin(self):
            return Tensor(np.sin(self._arr))

        def cos(self):
            return Tensor(np.cos(self._arr))

        def round(self, decimals=0):
            return Tensor(np.round(self._arr, decimals=decimals))

        def square(self):
            return Tensor(np.square(self._arr))

        def gather(self, dim, index):
            return torch.gather(self, dim, index)

        def topk(self, k, dim=-1, largest=True, sorted=True):
            return torch.topk(self, k, dim=dim, largest=largest, sorted=sorted)

        def sort(self, dim=-1, descending=False):
            return torch.sort(self, dim=dim, descending=descending)

        def unique(self, **kwargs):
            return torch.unique(self, **kwargs)

        def clamp(self, min=None, max=None):
            return Tensor(np.clip(self._arr, min, max))

        def clip(self, min=None, max=None):
            return self.clamp(min, max)

        def all(self, dim=None, keepdim=False):
            return Tensor(np.all(self._arr, axis=dim, keepdims=keepdim))

        def any(self, dim=None, keepdim=False):
            return Tensor(np.any(self._arr, axis=dim, keepdims=keepdim))

        def masked_fill(self, mask, value):
            m = mask._arr if isinstance(mask, Tensor) else np.asarray(mask, dtype=bool)
            new_arr = self._arr.copy()
            new_arr[m] = value
            return Tensor(new_arr)

        def masked_fill_(self, mask, value):
            m = mask._arr if isinstance(mask, Tensor) else np.asarray(mask, dtype=bool)
            self._arr[m] = value
            return self

        def baddbmm(self, batch1, batch2, beta=1, alpha=1):
            return torch.baddbmm(self, batch1, batch2, beta=beta, alpha=alpha)

        def cumsum(self, dim):
            return Tensor(np.cumsum(self._arr, axis=dim))

        def cumprod(self, dim):
            return Tensor(np.cumprod(self._arr, axis=dim))

        def diagonal(self, offset=0, dim1=0, dim2=1):
            return Tensor(np.diagonal(self._arr, offset=offset, axis1=dim1, axis2=dim2))

        def roll(self, shifts, dims=None):
            return Tensor(np.roll(self._arr, shifts, axis=dims))

        def narrow(self, dim, start, length):
            slc = [slice(None)] * self._arr.ndim
            slc[dim] = slice(start, start + length)
            return Tensor(self._arr[tuple(slc)])

        def nonzero(self, as_tuple=False):
            nz = np.nonzero(self._arr)
            if as_tuple:
                return tuple(Tensor(x) for x in nz)
            return Tensor(np.column_stack(nz))

        # Operators
        def __add__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr + o)

        def __radd__(self, other):
            return self.__add__(other)

        def __sub__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr - o)

        def __rsub__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(o - self._arr)

        def __mul__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr * o)

        def __rmul__(self, other):
            return self.__mul__(other)

        def __truediv__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr / o)

        def __rtruediv__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(o / self._arr)

        def __floordiv__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr // o)

        def __mod__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr % o)

        def __matmul__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(np.matmul(self._arr, o))

        def __rmatmul__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(np.matmul(o, self._arr))

        def __pow__(self, other):
            return Tensor(self._arr ** (other._arr if isinstance(other, Tensor) else other))

        def __neg__(self):
            return Tensor(-self._arr)

        def __pos__(self):
            return self

        def __invert__(self):
            return Tensor(~self._arr)

        def __lt__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr < o)

        def __le__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr <= o)

        def __gt__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr > o)

        def __ge__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr >= o)

        def __eq__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr == o)

        def __ne__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr != o)

        def __and__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr & o)

        def __or__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr | o)

        def __xor__(self, other):
            o = other._arr if isinstance(other, Tensor) else other
            return Tensor(self._arr ^ o)

        def __getitem__(self, item):
            if isinstance(item, Tensor):
                item = item._arr
            elif isinstance(item, tuple):
                item = tuple(x._arr if isinstance(x, Tensor) else x for x in item)
            elif isinstance(item, list):
                item = [x._arr if isinstance(x, Tensor) else x for x in item]
            if isinstance(item, np.ndarray) and np.issubdtype(item.dtype, np.floating):
                if np.all(np.equal(np.mod(item, 1), 0)):
                    item = item.astype(np.int64)
            res = self._arr[item]
            if isinstance(res, np.ndarray):
                return Tensor(res)
            return res

        def __setitem__(self, key, value):
            if isinstance(key, Tensor):
                key = key._arr
            v = value._arr if isinstance(value, Tensor) else value
            self._arr[key] = v

        def __len__(self):
            return len(self._arr)

        def __iter__(self):
            for x in self._arr:
                yield Tensor(x) if isinstance(x, np.ndarray) else x

        def __repr__(self):
            return f"tensor({self._arr.tolist()})"

    torch.Tensor = Tensor
    torch.tensor = lambda data, dtype=None, device=None: Tensor(data, dtype=dtype)
    torch.as_tensor = torch.tensor
    torch.from_numpy = lambda arr: Tensor(arr)
    torch.zeros = lambda *shape, **kwargs: Tensor(np.zeros(shape[0] if len(shape)==1 and isinstance(shape[0], (tuple,list)) else shape, dtype=kwargs.get('dtype', np.float32)))
    torch.ones = lambda *shape, **kwargs: Tensor(np.ones(shape[0] if len(shape)==1 and isinstance(shape[0], (tuple,list)) else shape, dtype=kwargs.get('dtype', np.float32)))
    torch.zeros_like = lambda t, **kwargs: Tensor(np.zeros_like(t._arr if isinstance(t, Tensor) else t, dtype=kwargs.get('dtype', getattr(t, 'dtype', np.float32))))
    torch.ones_like = lambda t, **kwargs: Tensor(np.ones_like(t._arr if isinstance(t, Tensor) else t, dtype=kwargs.get('dtype', getattr(t, 'dtype', np.float32))))
    torch.empty = torch.zeros
    torch.empty_like = torch.zeros_like
    torch.full = lambda shape, val, **kwargs: Tensor(np.full(shape[0] if len(shape)==1 and isinstance(shape[0], (tuple,list)) else shape, val, dtype=kwargs.get('dtype', np.float32)))
    torch.full_like = lambda t, val, **kwargs: Tensor(np.full_like(t._arr if isinstance(t, Tensor) else t, val, dtype=kwargs.get('dtype', getattr(t, 'dtype', np.float32))))
    torch.arange = lambda *args, **kwargs: Tensor(np.arange(*args, dtype=kwargs.get('dtype', np.int64)))
    torch.linspace = lambda start, end, steps, **kwargs: Tensor(np.linspace(start, end, steps, dtype=kwargs.get('dtype', np.float32)))
    torch.eye = lambda n, **kwargs: Tensor(np.eye(n, dtype=kwargs.get('dtype', np.float32)))
    torch.randn = lambda *shape, **kwargs: Tensor(np.random.randn(*(shape[0] if len(shape)==1 and isinstance(shape[0], (tuple,list)) else shape)).astype(kwargs.get('dtype', np.float32)))
    torch.randn_like = lambda t, **kwargs: Tensor(np.random.randn(*(t._arr if isinstance(t, Tensor) else t).shape).astype(kwargs.get('dtype', np.float32)))
    torch.rand = lambda *shape, **kwargs: Tensor(np.random.rand(*(shape[0] if len(shape)==1 and isinstance(shape[0], (tuple,list)) else shape)).astype(kwargs.get('dtype', np.float32)))
    torch.rand_like = lambda t, **kwargs: Tensor(np.random.rand(*(t._arr if isinstance(t, Tensor) else t).shape).astype(kwargs.get('dtype', np.float32)))
    torch.randint = lambda low, high, size, **kwargs: Tensor(np.random.randint(low, high, size, dtype=kwargs.get('dtype', np.int64)))

    torch.matmul = lambda a, b: Tensor(np.matmul(a._arr if isinstance(a, Tensor) else a, b._arr if isinstance(b, Tensor) else b))
    torch.bmm = torch.matmul
    torch.mm = torch.matmul
    torch.dot = lambda a, b: Tensor(np.dot(a._arr if isinstance(a, Tensor) else a, b._arr if isinstance(b, Tensor) else b))
    torch.cat = lambda tensors, dim=0: Tensor(np.concatenate([t._arr if isinstance(t, Tensor) else t for t in tensors], axis=dim))
    torch.stack = lambda tensors, dim=0: Tensor(np.stack([t._arr if isinstance(t, Tensor) else t for t in tensors], axis=dim))
    torch.split = lambda t, split_size, dim=0: [Tensor(x) for x in np.array_split(t._arr if isinstance(t, Tensor) else t, np.arange(split_size, (t._arr if isinstance(t, Tensor) else t).shape[dim], split_size), axis=dim)]
    torch.chunk = lambda t, chunks, dim=0: [Tensor(x) for x in np.array_split(t._arr if isinstance(t, Tensor) else t, chunks, axis=dim)]
    torch.squeeze = lambda t, dim=None: Tensor(np.squeeze(t._arr if isinstance(t, Tensor) else t, axis=dim))
    torch.unsqueeze = lambda t, dim: Tensor(np.expand_dims(t._arr if isinstance(t, Tensor) else t, axis=dim))
    torch.transpose = lambda t, dim0, dim1: (t.transpose(dim0, dim1) if isinstance(t, Tensor) else Tensor(t).transpose(dim0, dim1))
    torch.flatten = lambda t, start_dim=0, end_dim=-1: (t.flatten(start_dim, end_dim) if isinstance(t, Tensor) else Tensor(t).flatten(start_dim, end_dim))
    torch.reshape = lambda t, *shape: (t.reshape(*shape) if isinstance(t, Tensor) else Tensor(t).reshape(*shape))
    torch.exp = lambda t: Tensor(np.exp(t._arr if isinstance(t, Tensor) else t))
    torch.log = lambda t: Tensor(np.log(t._arr if isinstance(t, Tensor) else t))
    torch.sqrt = lambda t: Tensor(np.sqrt(t._arr if isinstance(t, Tensor) else t))
    torch.abs = lambda t: Tensor(np.abs(t._arr if isinstance(t, Tensor) else t))
    torch.sin = lambda t: Tensor(np.sin(t._arr if isinstance(t, Tensor) else t))
    torch.cos = lambda t: Tensor(np.cos(t._arr if isinstance(t, Tensor) else t))
    torch.tanh = lambda t: Tensor(np.tanh(t._arr if isinstance(t, Tensor) else t))
    torch.sigmoid = lambda t: Tensor(1.0 / (1.0 + np.exp(-np.array(t._arr if isinstance(t, Tensor) else t, dtype=float))))
    torch.clamp = lambda t, min=None, max=None: Tensor(np.clip(t._arr if isinstance(t, Tensor) else t, min, max))
    torch.mean = lambda t, dim=None, keepdim=False: Tensor(np.mean(t._arr if isinstance(t, Tensor) else t, axis=dim, keepdims=keepdim))
    torch.sum = lambda t, dim=None, keepdim=False: Tensor(np.sum(t._arr if isinstance(t, Tensor) else t, axis=dim, keepdims=keepdim))
    torch.max = lambda t, dim=None, keepdim=False: (Tensor(np.max(t._arr if isinstance(t, Tensor) else t)) if dim is None else Tensor(np.max(t._arr if isinstance(t, Tensor) else t, axis=dim, keepdims=keepdim)))
    torch.min = lambda t, dim=None, keepdim=False: (Tensor(np.min(t._arr if isinstance(t, Tensor) else t)) if dim is None else Tensor(np.min(t._arr if isinstance(t, Tensor) else t, axis=dim, keepdims=keepdim)))
    torch.argmax = lambda t, dim=None, keepdim=False: Tensor(np.argmax(t._arr if isinstance(t, Tensor) else t, axis=dim, keepdims=keepdim))
    torch.argmin = lambda t, dim=None, keepdim=False: Tensor(np.argmin(t._arr if isinstance(t, Tensor) else t, axis=dim, keepdims=keepdim))
    torch.std = lambda t, dim=None, keepdim=False, unbiased=True: Tensor(np.std(t._arr if isinstance(t, Tensor) else t, axis=dim, keepdims=keepdim, ddof=1 if unbiased else 0))
    torch.var = lambda t, dim=None, keepdim=False, unbiased=True: Tensor(np.var(t._arr if isinstance(t, Tensor) else t, axis=dim, keepdims=keepdim, ddof=1 if unbiased else 0))
    torch.norm = lambda t, p=2, dim=None, keepdim=False: Tensor(np.linalg.norm(t._arr if isinstance(t, Tensor) else t, ord=p, axis=dim, keepdims=keepdim))
    torch.all = lambda t, dim=None, keepdim=False: Tensor(np.all(t._arr if isinstance(t, Tensor) else t, axis=dim, keepdims=keepdim))
    torch.any = lambda t, dim=None, keepdim=False: Tensor(np.any(t._arr if isinstance(t, Tensor) else t, axis=dim, keepdims=keepdim))
    torch.where = lambda cond, x, y: Tensor(np.where(cond._arr if isinstance(cond, Tensor) else cond, x._arr if isinstance(x, Tensor) else x, y._arr if isinstance(y, Tensor) else y))
    torch.triu = lambda t, diagonal=0: Tensor(np.triu(t._arr if isinstance(t, Tensor) else t, k=diagonal))
    torch.tril = lambda t, diagonal=0: Tensor(np.tril(t._arr if isinstance(t, Tensor) else t, k=diagonal))
    torch.square = lambda t: Tensor(np.square(t._arr if isinstance(t, Tensor) else t))
    torch.round = lambda t, decimals=0: Tensor(np.round(t._arr if isinstance(t, Tensor) else t, decimals=decimals))
    torch.gather = lambda t, dim, index: Tensor(np.take_along_axis(t._arr if isinstance(t, Tensor) else np.asarray(t), index._arr if isinstance(index, Tensor) else np.asarray(index), axis=dim))
    torch.unique = lambda t, **kwargs: Tensor(np.unique(t._arr if isinstance(t, Tensor) else t))
    torch.masked_fill = lambda t, mask, val: t.masked_fill(mask, val)
    torch.baddbmm = lambda inp, b1, b2, beta=1, alpha=1: Tensor(beta * (inp._arr if isinstance(inp, Tensor) else inp) + alpha * np.matmul(b1._arr if isinstance(b1, Tensor) else b1, b2._arr if isinstance(b2, Tensor) else b2))
    torch.cumsum = lambda t, dim: Tensor(np.cumsum(t._arr if isinstance(t, Tensor) else t, axis=dim))
    torch.cumprod = lambda t, dim: Tensor(np.cumprod(t._arr if isinstance(t, Tensor) else t, axis=dim))
    torch.roll = lambda t, shifts, dims=None: Tensor(np.roll(t._arr if isinstance(t, Tensor) else t, shifts, axis=dims))
    torch.narrow = lambda t, dim, start, length: (t.narrow(dim, start, length) if isinstance(t, Tensor) else Tensor(t).narrow(dim, start, length))
    torch.nonzero = lambda t, as_tuple=False: (t.nonzero(as_tuple=as_tuple) if isinstance(t, Tensor) else Tensor(t).nonzero(as_tuple=as_tuple))
    torch.diag = lambda t, diagonal=0: Tensor(np.diag(t._arr if isinstance(t, Tensor) else t, k=diagonal))
    torch.diagonal = lambda t, offset=0, dim1=0, dim2=1: Tensor(np.diagonal(t._arr if isinstance(t, Tensor) else t, offset=offset, axis1=dim1, axis2=dim2))
    torch.diag_embed = lambda t, offset=0, dim1=-2, dim2=-1: Tensor(np.eye(t.shape[-1]) * t._arr[..., None] if isinstance(t, Tensor) else t)
    torch.meshgrid = lambda *tensors, indexing='ij': [Tensor(x) for x in np.meshgrid(*[t._arr if isinstance(t, Tensor) else t for t in tensors], indexing=indexing)]
    torch.outer = lambda a, b: Tensor(np.outer(a._arr if isinstance(a, Tensor) else a, b._arr if isinstance(b, Tensor) else b))
    torch.einsum = lambda eq, *operands: Tensor(np.einsum(eq, *[op._arr if isinstance(op, Tensor) else op for op in operands]))
    torch.clamp_min = lambda t, val: Tensor(np.maximum(t._arr if isinstance(t, Tensor) else t, val))
    torch.clamp_max = lambda t, val: Tensor(np.minimum(t._arr if isinstance(t, Tensor) else t, val))
    torch.isclose = lambda a, b, rtol=1e-5, atol=1e-8: Tensor(np.isclose(a._arr if isinstance(a, Tensor) else a, b._arr if isinstance(b, Tensor) else b, rtol=rtol, atol=atol))
    torch.allclose = lambda a, b, rtol=1e-5, atol=1e-8: bool(np.allclose(a._arr if isinstance(a, Tensor) else a, b._arr if isinstance(b, Tensor) else b, rtol=rtol, atol=atol))
    torch.concat = torch.cat

    class TopKResult:
        def __init__(self, values, indices):
            self.values = values
            self.indices = indices
        def __iter__(self):
            return iter((self.values, self.indices))
        def __getitem__(self, idx):
            return (self.values, self.indices)[idx]

    def _topk_fn(input, k, dim=-1, largest=True, sorted=True):
        arr = input._arr if isinstance(input, Tensor) else np.asarray(input)
        if largest:
            order = np.argsort(-arr, axis=dim)
        else:
            order = np.argsort(arr, axis=dim)
        slc = [slice(None)] * arr.ndim
        slc[dim] = slice(0, k)
        top_indices = order[tuple(slc)]
        top_values = np.take_along_axis(arr, top_indices, axis=dim)
        return TopKResult(Tensor(top_values), Tensor(top_indices))
    torch.topk = _topk_fn

    class SortResult:
        def __init__(self, values, indices):
            self.values = values
            self.indices = indices
        def __iter__(self):
            return iter((self.values, self.indices))
        def __getitem__(self, idx):
            return (self.values, self.indices)[idx]

    def _sort_fn(input, dim=-1, descending=False):
        arr = input._arr if isinstance(input, Tensor) else np.asarray(input)
        if descending:
            order = np.argsort(-arr, axis=dim)
        else:
            order = np.argsort(arr, axis=dim)
        sorted_vals = np.take_along_axis(arr, order, axis=dim)
        return SortResult(Tensor(sorted_vals), Tensor(order))
    torch.sort = _sort_fn

    class _Linalg:
        @staticmethod
        def svd(A, full_matrices=True):
            arr = A._arr if isinstance(A, Tensor) else np.asarray(A)
            u, s, vh = np.linalg.svd(arr, full_matrices=full_matrices)
            return Tensor(u), Tensor(s), Tensor(vh)
        norm = torch.norm
    torch.linalg = _Linalg()
    torch.manual_seed = lambda s: np.random.seed(s)

    class no_grad:
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def __call__(self, fn):
            def wrapper(*args, **kwargs):
                with self:
                    return fn(*args, **kwargs)
            return wrapper
    torch.no_grad = no_grad

    # Types
    torch.float32 = np.float32
    torch.float = np.float32
    torch.float64 = np.float64
    torch.double = np.float64
    torch.int32 = np.int32
    torch.int64 = np.int64
    torch.long = np.int64
    torch.bool = bool

    # Functional
    def _softmax(x, dim=-1):
        arr = x._arr if isinstance(x, Tensor) else np.asarray(x, dtype=float)
        shifted = arr - np.max(arr, axis=dim, keepdims=True)
        ex = np.exp(shifted)
        return Tensor(ex / np.sum(ex, axis=dim, keepdims=True))
    F.softmax = _softmax
    F.log_softmax = lambda x, dim=-1: Tensor(np.log((F.softmax(x, dim=dim))._arr))
    F.relu = lambda x: Tensor(np.maximum(0, x._arr if isinstance(x, Tensor) else x))
    F.gelu = lambda x: Tensor(0.5 * (x._arr if isinstance(x, Tensor) else x) * (1.0 + np.tanh(np.sqrt(2.0 / np.pi) * ((x._arr if isinstance(x, Tensor) else x) + 0.044715 * (x._arr if isinstance(x, Tensor) else x)**3))))
    F.sigmoid = torch.sigmoid
    F.silu = lambda x: Tensor((x._arr if isinstance(x, Tensor) else x) / (1.0 + np.exp(-np.array(x._arr if isinstance(x, Tensor) else x, dtype=float))))
    F.tanh = torch.tanh
    F.linear = lambda x, weight, bias=None: (torch.matmul(x, weight.T) + bias if bias is not None else torch.matmul(x, weight.T))
    F.mse_loss = lambda pred, target: torch.mean((pred - target) ** 2)
    F.layer_norm = lambda x, shape, weight=None, bias=None, eps=1e-5: x
    F.dropout = lambda x, p=0.5, training=True: x

    def _conv2d(input, weight, bias=None, stride=1, padding=0, dilation=1, groups=1):
        x = input._arr if isinstance(input, Tensor) else np.asarray(input)
        w = weight._arr if isinstance(weight, Tensor) else np.asarray(weight)
        b = bias._arr if isinstance(bias, Tensor) else (np.asarray(bias) if bias is not None else None)
        if isinstance(stride, int): stride = (stride, stride)
        if isinstance(padding, int): padding = (padding, padding)
        if isinstance(dilation, int): dilation = (dilation, dilation)
        N, C_in, H, W = x.shape
        C_out, in_g, kH, kW = w.shape
        pad_h, pad_w = padding
        str_h, str_w = stride
        dil_h, dil_w = dilation
        x_pad = np.pad(x, ((0,0), (0,0), (pad_h, pad_h), (pad_w, pad_w)), mode='constant') if (pad_h > 0 or pad_w > 0) else x
        out_h = (H + 2 * pad_h - (kH - 1) * dil_h - 1) // str_h + 1
        out_w = (W + 2 * pad_w - (kW - 1) * dil_w - 1) // str_w + 1
        out = np.zeros((N, C_out, out_h, out_w), dtype=x.dtype)
        for i in range(out_h):
            for j in range(out_w):
                h_idx = i * str_h + np.arange(kH) * dil_h
                w_idx = j * str_w + np.arange(kW) * dil_w
                patch = x_pad[:, :, h_idx[:, None], w_idx[None, :]]
                if groups == 1:
                    out[:, :, i, j] = np.einsum('nchw,ochw->no', patch, w)
                else:
                    c_out_g = C_out // groups
                    for g in range(groups):
                        patch_g = patch[:, g*in_g:(g+1)*in_g]
                        w_g = w[g*c_out_g:(g+1)*c_out_g]
                        out[:, g*c_out_g:(g+1)*c_out_g, i, j] = np.einsum('nchw,ochw->no', patch_g, w_g)
        if b is not None:
            out += b.reshape(1, -1, 1, 1)
        return Tensor(out)
    F.conv2d = _conv2d

    def _conv1d(input, weight, bias=None, stride=1, padding=0, dilation=1, groups=1):
        x = input._arr if isinstance(input, Tensor) else np.asarray(input)
        w = weight._arr if isinstance(weight, Tensor) else np.asarray(weight)
        b = bias._arr if isinstance(bias, Tensor) else (np.asarray(bias) if bias is not None else None)
        N, C_in, L = x.shape
        C_out, in_g, kL = w.shape
        x_pad = np.pad(x, ((0,0), (0,0), (padding, padding)), mode='constant') if padding > 0 else x
        out_l = (L + 2 * padding - (kL - 1) * dilation - 1) // stride + 1
        out = np.zeros((N, C_out, out_l), dtype=x.dtype)
        for i in range(out_l):
            l_idx = i * stride + np.arange(kL) * dilation
            patch = x_pad[:, :, l_idx]
            out[:, :, i] = np.einsum('ncl,ocl->no', patch, w)
        if b is not None:
            out += b.reshape(1, -1, 1)
        return Tensor(out)
    F.conv1d = _conv1d

    def _avg_pool2d(input, kernel_size, stride=None, padding=0):
        x = input._arr if isinstance(input, Tensor) else np.asarray(input)
        if isinstance(kernel_size, int): kernel_size = (kernel_size, kernel_size)
        if stride is None: stride = kernel_size
        elif isinstance(stride, int): stride = (stride, stride)
        if isinstance(padding, int): padding = (padding, padding)
        kH, kW = kernel_size
        str_h, str_w = stride
        pad_h, pad_w = padding
        N, C, H, W = x.shape
        x_pad = np.pad(x, ((0,0), (0,0), (pad_h, pad_h), (pad_w, pad_w)), mode='constant') if (pad_h > 0 or pad_w > 0) else x
        out_h = (H + 2 * pad_h - kH) // str_h + 1
        out_w = (W + 2 * pad_w - kW) // str_w + 1
        out = np.zeros((N, C, out_h, out_w), dtype=x.dtype)
        for i in range(out_h):
            for j in range(out_w):
                patch = x_pad[:, :, i*str_h:i*str_h+kH, j*str_w:j*str_w+kW]
                out[:, :, i, j] = np.mean(patch, axis=(2, 3))
        return Tensor(out)
    F.avg_pool2d = _avg_pool2d

    def _max_pool2d(input, kernel_size, stride=None, padding=0):
        x = input._arr if isinstance(input, Tensor) else np.asarray(input)
        if isinstance(kernel_size, int): kernel_size = (kernel_size, kernel_size)
        if stride is None: stride = kernel_size
        elif isinstance(stride, int): stride = (stride, stride)
        if isinstance(padding, int): padding = (padding, padding)
        kH, kW = kernel_size
        str_h, str_w = stride
        pad_h, pad_w = padding
        N, C, H, W = x.shape
        x_pad = np.pad(x, ((0,0), (0,0), (pad_h, pad_h), (pad_w, pad_w)), mode='constant', constant_values=-1e9) if (pad_h > 0 or pad_w > 0) else x
        out_h = (H + 2 * pad_h - kH) // str_h + 1
        out_w = (W + 2 * pad_w - kW) // str_w + 1
        out = np.zeros((N, C, out_h, out_w), dtype=x.dtype)
        for i in range(out_h):
            for j in range(out_w):
                patch = x_pad[:, :, i*str_h:i*str_h+kH, j*str_w:j*str_w+kW]
                out[:, :, i, j] = np.max(patch, axis=(2, 3))
        return Tensor(out)
    F.max_pool2d = _max_pool2d

    def _adaptive_avg_pool2d(input, output_size):
        x = input._arr if isinstance(input, Tensor) else np.asarray(input)
        if isinstance(output_size, int): output_size = (output_size, output_size)
        oH, oW = output_size
        if oH == 1 and oW == 1:
            return Tensor(np.mean(x, axis=(-2, -1), keepdims=True))
        N, C, H, W = x.shape
        out = np.zeros((N, C, oH, oW), dtype=x.dtype)
        for i in range(oH):
            h_s = int(np.floor(i * H / oH))
            h_e = int(np.ceil((i + 1) * H / oH))
            for j in range(oW):
                w_s = int(np.floor(j * W / oW))
                w_e = int(np.ceil((j + 1) * W / oW))
                out[:, :, i, j] = np.mean(x[:, :, h_s:h_e, w_s:w_e], axis=(2, 3))
        return Tensor(out)
    F.adaptive_avg_pool2d = _adaptive_avg_pool2d

    def _cross_entropy(input, target, weight=None, ignore_index=-100, reduction='mean'):
        inp = input._arr if isinstance(input, Tensor) else np.asarray(input, dtype=float)
        tgt = target._arr if isinstance(target, Tensor) else np.asarray(target)
        log_probs = inp - np.max(inp, axis=-1, keepdims=True)
        log_probs = log_probs - np.log(np.sum(np.exp(log_probs), axis=-1, keepdims=True))
        if tgt.ndim == inp.ndim - 1:
            loss = -np.take_along_axis(log_probs, np.expand_dims(tgt, -1), axis=-1).squeeze(-1)
        else:
            loss = -np.sum(tgt * log_probs, axis=-1)
        if reduction == 'mean':
            return Tensor(np.mean(loss))
        elif reduction == 'sum':
            return Tensor(np.sum(loss))
        return Tensor(loss)
    F.cross_entropy = _cross_entropy
    F.nll_loss = _cross_entropy

    def _cosine_similarity(x1, x2, dim=1, eps=1e-8):
        a = x1._arr if isinstance(x1, Tensor) else np.asarray(x1)
        b = x2._arr if isinstance(x2, Tensor) else np.asarray(x2)
        dot = np.sum(a * b, axis=dim)
        norm_a = np.linalg.norm(a, axis=dim)
        norm_b = np.linalg.norm(b, axis=dim)
        return Tensor(dot / np.maximum(norm_a * norm_b, eps))
    F.cosine_similarity = _cosine_similarity
    torch.cosine_similarity = _cosine_similarity

    def _pad(input, pad, mode='constant', value=0):
        arr = input._arr if isinstance(input, Tensor) else np.asarray(input)
        pad_width = [(0, 0)] * arr.ndim
        for idx in range(len(pad) // 2):
            axis = arr.ndim - 1 - idx
            pad_width[axis] = (pad[2 * idx], pad[2 * idx + 1])
        if mode == 'constant':
            res = np.pad(arr, pad_width, mode='constant', constant_values=value)
        else:
            res = np.pad(arr, pad_width, mode=mode)
        return Tensor(res)
    F.pad = _pad

    F.softplus = lambda x, beta=1, threshold=20: Tensor(np.where(x._arr * beta > threshold, x._arr, (1.0 / beta) * np.log1p(np.exp(x._arr * beta))))

    torch.softmax = _softmax

    class Module:
        def __init__(self):
            pass
        def __call__(self, *args, **kwargs):
            return self.forward(*args, **kwargs)
        def forward(self, *args, **kwargs):
            raise NotImplementedError
        def parameters(self):
            return []
        def to(self, *args, **kwargs):
            return self
        def train(self, mode=True):
            return self
        def eval(self):
            return self

    class Linear(Module):
        def __init__(self, in_features, out_features, bias=True):
            super().__init__()
            self.weight = Tensor(np.random.randn(out_features, in_features).astype(np.float32) / np.sqrt(in_features))
            self.bias = Tensor(np.zeros(out_features, dtype=np.float32)) if bias else None
        def forward(self, x):
            return F.linear(x, self.weight, self.bias)

    class LayerNorm(Module):
        def __init__(self, normalized_shape, eps=1e-5):
            super().__init__()
            self.eps = eps
        def forward(self, x):
            mean = x.mean(dim=-1, keepdim=True)
            var = x.var(dim=-1, keepdim=True, unbiased=False)
            return (x - mean) / torch.sqrt(var + self.eps)

    class RMSNorm(Module):
        def __init__(self, dim, eps=1e-6):
            super().__init__()
            self.eps = eps
        def forward(self, x):
            rms = torch.sqrt(torch.mean(x ** 2, dim=-1, keepdim=True) + self.eps)
            return x / rms

    class ModuleList(list):
        def __init__(self, modules=None):
            super().__init__(modules or [])
        def append(self, module):
            super().append(module)
            return self

    nn.Module = Module
    nn.Linear = Linear
    nn.LayerNorm = LayerNorm
    nn.RMSNorm = RMSNorm
    nn.Conv2d = lambda in_c, out_c, k, stride=1, padding=0, **kwargs: Module()
    nn.Conv1d = lambda in_c, out_c, k, stride=1, padding=0, **kwargs: Module()
    nn.AdaptiveAvgPool2d = lambda output_size: Module()
    nn.MaxPool2d = lambda k, stride=None, padding=0: Module()
    nn.AvgPool2d = lambda k, stride=None, padding=0: Module()
    nn.BatchNorm2d = lambda num_features, **kwargs: Module()
    nn.BatchNorm1d = lambda num_features, **kwargs: Module()
    nn.GELU = lambda: Module()
    nn.ReLU = lambda: Module()
    nn.Softmax = lambda dim=-1: Module()
    nn.CrossEntropyLoss = lambda **kwargs: Module()
    nn.MSELoss = lambda **kwargs: Module()
    nn.Dropout = lambda p=0.5: Module()
    nn.Embedding = lambda num, dim: Module()
    nn.Sequential = lambda *layers: Module()
    nn.Parameter = lambda data: Tensor(data)
    nn.ModuleList = ModuleList

    torch.nn = nn
    torch.nn.functional = F
    sys.modules['torch'] = torch
    sys.modules['torch.nn'] = nn
    sys.modules['torch.nn.functional'] = F

    # Mock triton
    triton = types.ModuleType('triton')
    tl = types.ModuleType('triton.language')
    triton.language = tl
    triton.jit = lambda fn: fn
    triton.autotune = lambda configs, key: (lambda fn: fn)
    triton.heuristics = lambda values: (lambda fn: fn)
    triton.Config = lambda *args, **kwargs: None
    tl.load = lambda ptr, mask=None, other=0: ptr
    tl.store = lambda ptr, val, mask=None: None
    tl.arange = lambda start, end: Tensor(np.arange(start, end))
    tl.program_id = lambda axis: 0
    tl.num_programs = lambda axis: 1
    tl.sum = torch.sum
    tl.max = torch.max
    tl.min = torch.min
    tl.exp = torch.exp
    tl.log = torch.log
    tl.sqrt = torch.sqrt
    tl.zeros = torch.zeros
    tl.full = torch.full
    tl.where = torch.where
    tl.dot = torch.matmul
    tl.constexpr = int

    sys.modules['triton'] = triton
    sys.modules['triton.language'] = tl

def _serialize_res(res):
    if res is None:
        return None
    elif hasattr(res, 'detach'):
        return res.detach().cpu().numpy().tolist()
    elif hasattr(res, 'tolist'):
        return res.tolist()
    elif isinstance(res, np.ndarray):
        return res.tolist()
    elif isinstance(res, (np.floating, float)):
        return float(res)
    elif isinstance(res, (np.integer, int)):
        return int(res)
    elif isinstance(res, (np.bool_, bool)):
        return bool(res)
    elif isinstance(res, dict):
        return {str(k): _serialize_res(v) for k, v in res.items()}
    elif isinstance(res, (list, tuple)):
        return [_serialize_res(x) for x in res]
    return res

def _check_equal(actual, expected):
    if actual is None and expected is not None:
        return False, "Function returned None. Make sure to return the computed result."
    if expected is None:
        return (actual is not None), ""

    if hasattr(actual, 'detach'):
        actual = actual.detach().cpu().numpy()
    elif hasattr(actual, 'numpy'):
        actual = actual.numpy()

    if hasattr(expected, 'detach'):
        expected = expected.detach().cpu().numpy()
    elif hasattr(expected, 'numpy'):
        expected = expected.numpy()

    if hasattr(actual, 'item') and hasattr(actual, 'ndim') and actual.ndim == 0:
        actual = actual.item()
    if hasattr(expected, 'item') and hasattr(expected, 'ndim') and expected.ndim == 0:
        expected = expected.item()

    # Handle numpy / list / tuple
    if isinstance(expected, (list, tuple)) or isinstance(actual, (list, tuple, np.ndarray)):
        # If both are sequences of the exact same length, try elementwise check first (handles tuples of arrays/scalars like (w, b))
        if isinstance(actual, (list, tuple, np.ndarray)) and isinstance(expected, (list, tuple, np.ndarray)):
            try:
                act_list = list(actual)
                exp_list = list(expected)
                if len(act_list) == len(exp_list):
                    all_matched = True
                    first_err = ""
                    for a_item, e_item in zip(act_list, exp_list):
                        ok_item, msg_item = _check_equal(a_item, e_item)
                        if not ok_item:
                            all_matched = False
                            first_err = msg_item
                            break
                    if all_matched:
                        return True, ""
            except Exception:
                pass
        try:
            act_arr = np.array(actual, dtype=float)
            exp_arr = np.array(expected, dtype=float)
            if act_arr.shape != exp_arr.shape:
                return False, f"Shape mismatch: got {act_arr.shape}, expected {exp_arr.shape}"
            close = np.allclose(act_arr, exp_arr, rtol=1e-3, atol=1e-4, equal_nan=True)
            return bool(close), "" if close else "Array values do not match expected output"
        except Exception:
            try:
                eq = list(actual) == list(expected)
                return eq, "" if eq else "List items do not match"
            except Exception:
                return False, "Failed to compare sequence outputs"

    # Handle dict
    if isinstance(expected, dict) or isinstance(actual, dict):
        if not (isinstance(actual, dict) and isinstance(expected, dict)):
            return False, f"Type mismatch: expected dict, got {type(actual).__name__}"
        if set(actual.keys()) == set(expected.keys()):
            for k in expected:
                ok, msg = _check_equal(actual[k], expected[k])
                if not ok:
                    return False, f"Mismatch in '{k}': {msg}"
            return True, ""
        # Fallback for stringified tuple keys in JSON (e.g. ('a', 'b') -> "('a', 'b')")
        act_str_keys = {str(k): k for k in actual}
        exp_str_keys = {str(k): k for k in expected}
        if set(act_str_keys.keys()) == set(exp_str_keys.keys()):
            for sk in exp_str_keys:
                ok, msg = _check_equal(actual[act_str_keys[sk]], expected[exp_str_keys[sk]])
                if not ok:
                    return False, f"Mismatch in '{sk}': {msg}"
            return True, ""
        return False, f"Dictionary keys mismatch: got {list(actual.keys())}, expected {list(expected.keys())}"

    # Handle float/int
    if isinstance(expected, (int, float)) and isinstance(actual, (int, float, np.number)):
        diff = abs(float(actual) - float(expected))
        ok = (diff <= 1e-3) or (diff / (abs(float(expected)) + 1e-9) <= 1e-3)
        return ok, "" if ok else f"Expected {expected}, got {actual}"

    eq = (actual == expected)
    return eq, "" if eq else f"Expected {expected}, got {actual}"
`;

export async function getPyodide(): Promise<any> {
  if (window.pyodideInstance) {
    return window.pyodideInstance;
  }

  if (pyodideLoadingPromise) {
    return pyodideLoadingPromise;
  }

  pyodideLoadingPromise = (async () => {
    if (typeof window.loadPyodide !== 'function') {
      throw new Error('Pyodide script not loaded yet. Check internet connection.');
    }
    const pyodide = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
    });
    // Preload numpy
    try {
      await pyodide.loadPackage(['numpy']);
    } catch (e) {
      console.warn('Could not preload numpy package:', e);
    }

    // Initialize full preamble environment
    try {
      await pyodide.runPythonAsync(PYTHON_PREAMBLE);
    } catch (e) {
      console.error('Failed to initialize Pyodide preamble:', e);
    }

    window.pyodideInstance = pyodide;
    return pyodide;
  })();

  return pyodideLoadingPromise;
}

export interface TensorVariableMeta {
  name: string;
  shape: number[];
  dtype: string;
  ndim: number;
  size: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  hasNaN: boolean;
  hasInf: boolean;
  slice2D?: number[][] | null;
  fullShapeStr: string;
}

export async function runPythonRepl(
  snippet: string,
  userCode?: string,
  inputs?: Record<string, any>
): Promise<{ output: string; error?: string }> {
  try {
    const pyodide = await getPyodide();

    // If inputs are provided, inject them as np.ndarray or native variables in Python scope
    if (inputs && Object.keys(inputs).length > 0) {
      for (const [k, v] of Object.entries(inputs)) {
        try {
          pyodide.globals.set(`__repl_inp_${k}`, pyodide.toPy(v));
          pyodide.runPython(`
try:
    __raw_val = globals().get('__repl_inp_${k}')
    if isinstance(__raw_val, (list, tuple)):
        ${k} = np.asarray(__raw_val)
    else:
        ${k} = __raw_val
except Exception:
    pass
`);
        } catch {}
      }
    }

    // If userCode is provided, pre-evaluate it so user functions & classes exist
    if (userCode && userCode.trim()) {
      try {
        await pyodide.runPythonAsync(userCode);
      } catch (e) {
        // Continue even if starter code has minor syntax issues
      }
    }

    // Set snippet safely into pyodide globals to avoid escaping issues
    pyodide.globals.set('__repl_snippet', snippet.trim());

    const evalCode = `
import sys
import io
import ast

__buf = io.StringIO()
__old_stdout = sys.stdout
sys.stdout = __buf
__err = ""

try:
    __code_str = globals().get('__repl_snippet', '').strip()
    if __code_str:
        # Check if it's a single expression (e.g. x.shape, 2+2)
        try:
            __parsed = ast.parse(__code_str, mode='eval')
            __val = eval(compile(__parsed, '<repl>', 'eval'), globals())
            if __val is not None:
                # Format numpy arrays and tensors nicely
                if hasattr(__val, 'shape'):
                    print(repr(__val))
                    print(f"# Shape: {getattr(__val, 'shape', ())} | dtype: {getattr(__val, 'dtype', 'unknown')} | size: {getattr(__val, 'size', 'N/A')}")
                else:
                    print(repr(__val))
        except SyntaxError:
            # Multi-statement code or assignment (e.g. a = np.zeros((3, 3)))
            exec(__code_str, globals())
except Exception as __e:
    __err = f"{type(__e).__name__}: {__e}"
finally:
    sys.stdout = __old_stdout

__repl_output = __buf.getvalue().strip()
if __err:
    if __repl_output:
        __repl_output = __repl_output + "\n" + __err
    else:
        __repl_output = __err
__repl_output
`;

    const out = await pyodide.runPythonAsync(evalCode);
    return { output: out || '(executed with no output)' };
  } catch (err: any) {
    return { output: '', error: err.message || String(err) };
  }
}

export async function inspectTensorVariables(
  inputs?: Record<string, any>
): Promise<TensorVariableMeta[]> {
  try {
    const pyodide = await getPyodide();

    if (inputs && Object.keys(inputs).length > 0) {
      const keys = Object.keys(inputs);
      pyodide.globals.set('__inspect_keys_json', JSON.stringify(keys));
      for (const [k, v] of Object.entries(inputs)) {
        try {
          pyodide.globals.set(`__repl_inp_${k}`, pyodide.toPy(v));
          pyodide.runPython(`
try:
    __raw_val = globals().get('__repl_inp_${k}')
    if isinstance(__raw_val, (list, tuple)):
        ${k} = np.asarray(__raw_val)
    else:
        ${k} = __raw_val
except Exception:
    pass
`);
        } catch {}
      }
    } else {
      pyodide.globals.set('__inspect_keys_json', '[]');
    }

    const inspectPython = `
import json
import numpy as np

def _extract_meta(k, val):
    try:
        arr = val if hasattr(val, 'shape') else np.asarray(val)
        shape = [int(s) for s in getattr(arr, 'shape', ())]
        dtype = str(getattr(arr, 'dtype', type(val).__name__))
        ndim = int(getattr(arr, 'ndim', 0))
        size = int(getattr(arr, 'size', 1))

        val_min, val_max, val_mean = None, None, None
        has_nan, has_inf = False, False

        if hasattr(arr, 'dtype') and np.issubdtype(arr.dtype, np.number) and size > 0:
            try:
                has_nan = bool(np.isnan(arr).any())
                has_inf = bool(np.isinf(arr).any())
                val_min = round(float(np.min(arr)), 4)
                val_max = round(float(np.max(arr)), 4)
                val_mean = round(float(np.mean(arr)), 4)
            except Exception:
                pass

        slice_2d = None
        if ndim == 1:
            try:
                slice_2d = [[round(float(x), 4) for x in arr[:8].tolist()]]
            except Exception:
                pass
        elif ndim >= 2:
            try:
                sub = arr
                while getattr(sub, 'ndim', 0) > 2:
                    sub = sub[0]
                rows = sub[:8]
                slice_2d = []
                for row in rows:
                    slice_2d.append([round(float(x), 4) for x in row[:8].tolist()])
            except Exception:
                pass

        return {
            "name": k,
            "shape": shape,
            "dtype": dtype,
            "ndim": ndim,
            "size": size,
            "min": val_min,
            "max": val_max,
            "mean": val_mean,
            "hasNaN": has_nan,
            "hasInf": has_inf,
            "slice2D": slice_2d,
            "fullShapeStr": f"({', '.join(str(d) for d in shape)})" if shape else "scalar"
        }
    except Exception:
        return None

__res = []
__keys = json.loads(globals().get('__inspect_keys_json', '[]'))
for __k in __keys:
    if __k in globals():
        __m = _extract_meta(__k, globals()[__k])
        if __m:
            __res.append(__m)

for __k, __v in list(globals().items()):
    if not __k.startswith('_') and __k not in __keys and __k not in [
        'np', 'numpy', 'torch', 'sys', 'io', 'json', 'ast', 'math', 'inspect', 'getPyodide'
    ]:
        if hasattr(__v, 'shape') or isinstance(__v, (list, tuple)):
            __m = _extract_meta(__k, __v)
            if __m:
                __res.append(__m)

json.dumps(__res)
`;
    const resJson = await pyodide.runPythonAsync(inspectPython);
    return JSON.parse(resJson || '[]');
  } catch (err) {
    console.warn('Failed to inspect tensor variables:', err);
    return [];
  }
}

export interface TestCaseExecutionResult {
  id: string;
  name: string;
  inputs: Record<string, any>;
  expectedOutput?: any;
  actualOutput: any;
  passed: boolean;
  error?: string;
  executionTimeMs: number;
}

export interface ExecutionReport {
  success: boolean;
  results: TestCaseExecutionResult[];
  stdout: string;
  stderr: string;
  totalTimeMs: number;
}

export async function runPythonCode(
  userCode: string,
  functionName: string = '',
  testCases: Array<{ id: string; name: string; inputs: Record<string, any>; expectedOutput?: any }> = []
): Promise<ExecutionReport> {
  const pyodide = await getPyodide();
  const startTime = performance.now();

  let capturedStdout = '';
  let capturedStderr = '';

  pyodide.setStdout({
    batched: (msg: string) => {
      capturedStdout += msg + '\n';
    }
  });

  pyodide.setStderr({
    batched: (msg: string) => {
      capturedStderr += msg + '\n';
    }
  });

  // Ensure preamble is always fresh before user code runs
  try {
    await pyodide.runPythonAsync(PYTHON_PREAMBLE);
  } catch (err: any) {
    console.warn('Preamble refresh warning:', err);
  }

  try {
    // 1. Run user code definitions in global namespace
    await pyodide.runPythonAsync(userCode);
  } catch (err: any) {
    return {
      success: false,
      results: [],
      stdout: capturedStdout,
      stderr: err.message || String(err),
      totalTimeMs: performance.now() - startTime
    };
  }

  const results: TestCaseExecutionResult[] = [];
  let allPassed = true;

  for (const tc of testCases) {
    const tcStart = performance.now();
    try {
      // Pass inputs into Pyodide namespace
      const inputKeys = Object.keys(tc.inputs || {});
      for (const k of inputKeys) {
        pyodide.globals.set(`__tc_${k}`, pyodide.toPy(tc.inputs[k]));
      }

      // Pass expected output into namespace
      if (tc.expectedOutput !== undefined) {
        pyodide.globals.set('__tc_expected', pyodide.toPy(tc.expectedOutput));
      } else {
        pyodide.runPython('__tc_expected = None');
      }

      const inputKeysJson = JSON.stringify(inputKeys);
      const runnerCode = `
try:
    import inspect
    __fn = globals().get('${functionName}') or locals().get('${functionName}')
    if not callable(__fn):
        # Fallback 1: check if a class provides this method
        for __k, __v in list(globals().items()):
            if inspect.isclass(__v) and not __k.startswith('_'):
                try:
                    __inst = __v()
                    if hasattr(__inst, '${functionName}') and callable(getattr(__inst, '${functionName}')):
                        __fn = getattr(__inst, '${functionName}')
                        break
                except Exception:
                    pass

        # Fallback 2: search globals for candidate user function
        if not callable(__fn):
            __candidates = [
                v for k, v in list(globals().items()) 
                if inspect.isfunction(v) and not k.startswith('_') and k not in ['getPyodide', 'json', 'np', 'numpy', '_check_equal', '_serialize_res']
            ]
            if __candidates:
                __fn = __candidates[0]
            else:
                raise NameError("Function '${functionName}' is not defined. Please implement def ${functionName}(...)")
    
    __sig = inspect.signature(__fn)
    __params = __sig.parameters
    __kwargs = {}
    __input_keys = ${inputKeysJson}
    
    # Check which parameters match input keys
    for __p_name in __params:
        if __p_name in __input_keys:
            __kwargs[__p_name] = globals()['__tc_' + __p_name]
    
    # Check if all required positional params were matched
    __required_missing = [
        __p_name for __p_name, __p in __params.items()
        if __p.default is inspect.Parameter.empty
        and __p.kind not in (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD)
        and __p_name not in __kwargs
    ]
    
    def _invoke(__use_tensor=False):
        import torch
        __active_kwargs = dict(__kwargs)
        if __use_tensor:
            for __k, __v in __active_kwargs.items():
                if isinstance(__v, list):
                    try:
                        __active_kwargs[__k] = torch.tensor(__v)
                    except Exception:
                        pass
        if not __required_missing:
            if any(__p.kind == inspect.Parameter.VAR_KEYWORD for __p in __params.values()):
                for __k in __input_keys:
                    if __k not in __active_kwargs:
                        val = globals()['__tc_' + __k]
                        if __use_tensor and isinstance(val, list):
                            try:
                                val = torch.tensor(val)
                            except Exception:
                                pass
                        __active_kwargs[__k] = val
            return __fn(**__active_kwargs)
        else:
            __pos_args = [globals()['__tc_' + __k] for __k in __input_keys]
            if __use_tensor:
                __converted = []
                for x in __pos_args:
                    if isinstance(x, list):
                        try:
                            __converted.append(torch.tensor(x))
                        except Exception:
                            __converted.append(x)
                    else:
                        __converted.append(x)
                __pos_args = __converted
            return __fn(*__pos_args)

    try:
        __actual_raw = _invoke(__use_tensor=False)
    except (AttributeError, TypeError) as __initial_err:
        # If call failed because the user solution expects torch.Tensor methods on array inputs (e.g. .clone(), .shape, .dim()), retry with torch.tensor
        try:
            __actual_raw = _invoke(__use_tensor=True)
        except Exception:
            raise __initial_err
        
    __passed, __err_msg = _check_equal(__actual_raw, __tc_expected)
    __res_obj = {
        "passed": __passed,
        "actual": _serialize_res(__actual_raw),
        "error": __err_msg if not __passed else ""
    }
except Exception as __e:
    __res_obj = {
        "passed": False,
        "actual": None,
        "error": str(__e)
    }

json.dumps(__res_obj)
`;

      const jsonStr = await pyodide.runPythonAsync(runnerCode);
      const resData = JSON.parse(jsonStr);

      const passed = Boolean(resData.passed);
      if (!passed) {
        allPassed = false;
      }

      results.push({
        id: tc.id,
        name: tc.name,
        inputs: tc.inputs,
        expectedOutput: tc.expectedOutput,
        passed,
        actualOutput: resData.actual,
        error: resData.error || undefined,
        executionTimeMs: performance.now() - tcStart
      });
    } catch (err: any) {
      allPassed = false;
      results.push({
        id: tc.id,
        name: tc.name,
        inputs: tc.inputs,
        expectedOutput: tc.expectedOutput,
        passed: false,
        actualOutput: null,
        error: err.message || String(err),
        executionTimeMs: performance.now() - tcStart
      });
    }
  }

  return {
    success: allPassed && results.length > 0,
    results,
    stdout: capturedStdout,
    stderr: capturedStderr,
    totalTimeMs: performance.now() - startTime
  };
}

/**
 * Run submission against comprehensive test suite (7 test cases).
 * If testCases has fewer than 7 cases, dynamically synthesizes diverse variations
 * (edge cases, scaled, negative, boundary values) to evaluate code over 7 cases.
 */
export async function runPythonSubmission(
  userCode: string,
  functionName: string,
  testCases: Array<{ id: string; name: string; inputs: Record<string, any>; expectedOutput?: any }>,
  refSolutionCode?: string | null,
  targetCount: number = 7
): Promise<ExecutionReport> {
  let expandedCases = [...testCases];

  if (expandedCases.length < targetCount && expandedCases.length > 0) {
    try {
      const pyodide = await getPyodide();

      let cleanRefCode = '';
      if (refSolutionCode) {
        const blocks = [...refSolutionCode.matchAll(/```(?:python|py)?\s*([\s\S]*?)```/g)]
          .map(m => m[1].trim())
          .filter(b => b.length > 0);
        cleanRefCode = blocks.length > 0 ? blocks.reduce((p, c) => (c.length > p.length ? c : p)) : refSolutionCode;
      }

      pyodide.globals.set('__base_tcs_json', JSON.stringify(testCases));
      pyodide.globals.set('__ref_code_str', cleanRefCode);
      pyodide.globals.set('__target_n', targetCount);
      pyodide.globals.set('__fn_name', functionName);

      const generatorScript = `
import json, copy, inspect

def _expand():
    base_tcs = json.loads(__base_tcs_json)
    ref_code = __ref_code_str
    target_n = int(__target_n)
    fn_name = __fn_name
    
    fn = None
    if ref_code:
        try:
            locs = {}
            exec("import numpy as np", locs, locs)
            exec(ref_code, locs, locs)
            fn = locs.get(fn_name)
            if not fn:
                for k, v in locs.items():
                    if callable(v) and not k.startswith('_'):
                        fn = v
                        break
        except Exception:
            pass

    def mutate(val, factor, mode):
        if isinstance(val, (int, float)):
            if mode == "zero": return 0 if isinstance(val, int) else 0.0
            if mode == "neg": return -val
            if mode == "add": return val + factor
            return round(val * factor, 4) if isinstance(val, float) else int(round(val * factor))
        elif isinstance(val, list):
            if not val: return val
            if isinstance(val[0], list):
                return [mutate(row, factor, mode) for row in val]
            elif isinstance(val[0], (int, float)):
                if mode == "reverse": return list(reversed(val))
                if mode == "neg": return [-x for x in val]
                if mode == "zeros": return [0 if isinstance(x, int) else 0.0 for x in val]
                return [mutate(x, factor, mode) for x in val]
        return val

    rules = [
        ("scale", 2.0), ("scale", 0.5), ("scale", -1.0), ("scale", 3.0),
        ("add", 1.0), ("add", -2.0), ("reverse", 1.0), ("neg", 1.0),
        ("scale", 10.0), ("scale", 0.1), ("add", 5.0), ("scale", 1.5),
        ("scale", -2.0), ("scale", 0.25), ("add", -1.0), ("scale", 4.0),
        ("scale", 0.75), ("scale", 5.0), ("add", 10.0), ("scale", -0.5),
        ("add", 2.0), ("scale", 0.8), ("add", -5.0), ("scale", 6.0)
    ]

    out_cases = list(base_tcs)
    base_inp = base_tcs[0].get("inputs", {})

    for mode, factor in rules:
        if len(out_cases) >= target_n:
            break
        try:
            cand = {}
            for k, v in base_inp.items():
                cand[k] = mutate(copy.deepcopy(v), factor, mode)
            exp = None
            if fn:
                try:
                    res = fn(**cand)
                    exp = _serialize_res(res)
                except Exception:
                    try:
                        res = fn(*cand.values())
                        exp = _serialize_res(res)
                    except Exception:
                        exp = base_tcs[0].get("expectedOutput")
            else:
                exp = base_tcs[0].get("expectedOutput")

            out_cases.append({
                "id": f"tc-submit-{len(out_cases)+1}",
                "name": f"Case {len(out_cases)+1}",
                "inputs": cand,
                "expectedOutput": exp,
                "isPublic": False
            })
        except Exception:
            pass

    while len(out_cases) < target_n:
        idx = len(out_cases) % len(base_tcs)
        dup = copy.deepcopy(base_tcs[idx])
        dup["id"] = f"tc-submit-{len(out_cases)+1}"
        dup["name"] = f"Case {len(out_cases)+1}"
        dup["isPublic"] = False
        out_cases.append(dup)

    return json.dumps(out_cases)

_expand()
`;
      const resJson = await pyodide.runPythonAsync(generatorScript);
      const parsed = JSON.parse(resJson);
      if (Array.isArray(parsed) && parsed.length >= targetCount) {
        expandedCases = parsed;
      }
    } catch (err) {
      console.warn('Test case expansion fallback:', err);
      while (expandedCases.length < targetCount) {
        const idx = expandedCases.length % testCases.length;
        const dup = { ...testCases[idx] };
        dup.id = `tc-submit-${expandedCases.length + 1}`;
        dup.name = `Case ${expandedCases.length + 1}`;
        expandedCases.push(dup);
      }
    }
  }

  return runPythonCode(userCode, functionName, expandedCases);
}
