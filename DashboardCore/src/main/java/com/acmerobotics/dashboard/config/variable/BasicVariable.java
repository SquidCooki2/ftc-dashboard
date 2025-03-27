package com.acmerobotics.dashboard.config.variable;

import com.acmerobotics.dashboard.config.ValueProvider;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

public class BasicVariable<T> extends ConfigVariable<T> {
    private VariableType type;
    private ValueProvider<T> provider;

    // Store deep copy of the original value
    private T originalValue;

    private static <T> VariableType inferType(ValueProvider<T> provider) {
        Class<?> providerClass = provider.get().getClass();
        return VariableType.fromClass(providerClass);
    }

    public BasicVariable(ValueProvider<T> provider) {
        this(inferType(provider), provider);
    }

    public BasicVariable(VariableType type, ValueProvider<T> provider) {
        this.type = type;
        this.provider = provider;

        // Store the original value as a deep copy
        this.originalValue = deepCopy(provider.get());
    }

    @Override
    public VariableType getType() {
        return type;
    }

    @Override
    public T getValue() {
        return provider.get();
    }

    @Override
    public void update(ConfigVariable<T> newVariable) {
        provider.set(newVariable.getValue());
    }

    @Override
    public boolean hasChanged() {
        if (originalValue == null && provider.get() == null) return false;
        if (originalValue == null && provider.get() != null) return true;

        if (originalValue instanceof Comparable) {
            // Use compareTo for objects that implement Comparable
            return ((Comparable) originalValue).compareTo(provider.get()) != 0;
        }

        return !originalValue.equals(provider.get());
    }

    // Reset original value to current state
    public void reset() {
        originalValue = deepCopy(provider.get());
    }

    @SuppressWarnings("unchecked")
    private T deepCopy(T obj) {
        if (obj == null) return null;

        try {
            // Use ByteArray streams to serialize and deserialize the object
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            ObjectOutputStream out = new ObjectOutputStream(bos);
            out.writeObject(obj);
            out.flush();
            ByteArrayInputStream bis = new ByteArrayInputStream(bos.toByteArray());
            ObjectInputStream in = new ObjectInputStream(bis);

            return (T) in.readObject();
        } catch (IOException | ClassNotFoundException e) {
            throw new RuntimeException("Failed to create deep copy", e);
        }
    }
}
